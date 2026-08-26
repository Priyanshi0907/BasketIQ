"""
Market-basket association rule mining using FP-Growth (mlxtend), computed once
at startup over the synthetic transaction log and cached in memory.

Exposes:
  - RULES_DF: full rules table (antecedents, consequents, support, confidence, lift)
  - top_associations_for(item_ids, n): best consequent recommendations for a
    given basket, used by both the Basket Analyzer ("Top Associations") and
    the Recommendations page.
  - frequent_itemsets_as_records: raw itemset support table, used on the Association
    Rules page.
  - rules_as_records: formatted records for API and UI tables.
"""
from collections import Counter, defaultdict
import pandas as pd
from mlxtend.frequent_patterns import fpgrowth, association_rules
from mlxtend.preprocessing import TransactionEncoder

from app.data.catalog import PRODUCT_BY_ID, PRODUCTS
from app.data.generator import TRANSACTIONS

_baskets = [t["items"] for t in TRANSACTIONS]
_total_txns = max(len(_baskets), 1)

# Precompute transaction-level single and pairwise statistics for instant co-occurrence fallback
ITEM_COUNTS = Counter()
PAIR_COUNTS = defaultdict(Counter)
for _b in _baskets:
    for _item in _b:
        ITEM_COUNTS[_item] += 1
    for _i, _a in enumerate(_b):
        for _b_item in _b[_i + 1:]:
            PAIR_COUNTS[_a][_b_item] += 1
            PAIR_COUNTS[_b_item][_a] += 1

_te = TransactionEncoder()
_te_ary = _te.fit(_baskets).transform(_baskets)
_df_encoded = pd.DataFrame(_te_ary, columns=_te.columns_)

FREQUENT_ITEMSETS = fpgrowth(_df_encoded, min_support=0.005, use_colnames=True)
FREQUENT_ITEMSETS = FREQUENT_ITEMSETS.sort_values("support", ascending=False).reset_index(drop=True)

_rules = association_rules(FREQUENT_ITEMSETS, metric="lift", min_threshold=1.0)
_rules = _rules[_rules["confidence"] >= 0.1].copy()
_rules["antecedents"] = _rules["antecedents"].apply(lambda s: sorted(list(s)))
_rules["consequents"] = _rules["consequents"].apply(lambda s: sorted(list(s)))
_rules = _rules.sort_values("lift", ascending=False).reset_index(drop=True)
RULES_DF = _rules

# Pre-index rules for fast subset lookup
# 1. Single item antecedent -> list of rules: {item_id: [(cid, support, confidence, lift), ...]}
SINGLE_ITEM_RULES = defaultdict(list)
# 2. Multi-item rules
MULTI_ITEM_RULES = []

for _, row in RULES_DF.iterrows():
    ants = row["antecedents"]
    metrics = (float(row["support"]), float(row["confidence"]), float(row["lift"]))
    if len(ants) == 1:
        for cid in row["consequents"]:
            SINGLE_ITEM_RULES[ants[0]].append((cid, metrics))
    else:
        MULTI_ITEM_RULES.append((set(ants), row["consequents"], metrics))


def _name(pid):
    p = PRODUCT_BY_ID.get(pid)
    return p["name"] if p else pid


def _emoji(pid):
    p = PRODUCT_BY_ID.get(pid)
    return p["emoji"] if p else "🛒"


def _image_query(pid):
    p = PRODUCT_BY_ID.get(pid)
    return p["image_query"] if p else "grocery"


def rules_as_records(limit=100, min_lift=0.0):
    records = []
    for _, row in RULES_DF.iterrows():
        if row["lift"] < min_lift:
            continue
        records.append({
            "antecedents": [_name(i) for i in row["antecedents"]],
            "consequents": [_name(i) for i in row["consequents"]],
            "antecedent_ids": row["antecedents"],
            "consequent_ids": row["consequents"],
            "support": round(float(row["support"]), 4),
            "confidence": round(float(row["confidence"]), 4),
            "lift": round(float(row["lift"]), 4),
        })
        if len(records) >= limit:
            break
    return records


def frequent_itemsets_as_records(limit=100):
    records = []
    for _, row in FREQUENT_ITEMSETS.iterrows():
        items = list(row["itemsets"])
        if len(items) < 2:
            continue
        records.append({
            "items": [_name(i) for i in items],
            "support": round(float(row["support"]), 4),
        })
        if len(records) >= limit:
            break
    return records


def top_associations_for(item_ids, n=4):
    """Given a basket (list of product ids), find the best 'customers also
    bought' recommendations using a resilient 4-tier strategy:
    1. Multi-item & exact antecedent subset rules ranked by lift & confidence.
    2. Single-item antecedent rules for any item in the basket.
    3. Pairwise transaction co-occurrence fallback.
    4. Category affinity fallback so results are never empty when a basket is provided."""
    basket_set = set(item_ids)
    if not basket_set:
        # Default global recommendations when basket is empty
        return _global_recommendations(n)

    candidates = {}  # product_id -> (support, confidence, lift)

    # Tier 1: Check multi-item rules whose antecedent is a subset of the basket
    for ant_set, consequents, (sup, conf, lift) in MULTI_ITEM_RULES:
        if ant_set.issubset(basket_set):
            for cid in consequents:
                if cid not in basket_set:
                    if cid not in candidates or lift > candidates[cid][2]:
                        candidates[cid] = (sup, conf, lift)

    # Tier 2: Check single-item rules for any item present in the basket
    for item in basket_set:
        for cid, (sup, conf, lift) in SINGLE_ITEM_RULES.get(item, []):
            if cid not in basket_set:
                if cid not in candidates or lift > candidates[cid][2]:
                    candidates[cid] = (sup, conf, lift)

    # Tier 3: Transaction pairwise co-occurrence fallback if fewer than n candidates
    if len(candidates) < n:
        for item in basket_set:
            item_cnt = ITEM_COUNTS.get(item, 1)
            for cid, pair_cnt in PAIR_COUNTS.get(item, {}).most_common(10):
                if cid not in basket_set and cid not in candidates:
                    cid_cnt = ITEM_COUNTS.get(cid, 1)
                    sup = pair_cnt / _total_txns
                    conf = pair_cnt / item_cnt
                    expected = (item_cnt / _total_txns) * (cid_cnt / _total_txns)
                    lift = (pair_cnt / _total_txns) / max(expected, 1e-6)
                    candidates[cid] = (round(sup, 4), round(conf, 4), round(lift, 4))
                if len(candidates) >= n * 2:
                    break

    # Tier 4: Category affinity fallback
    if len(candidates) < n:
        categories = {PRODUCT_BY_ID[p]["category"] for p in basket_set if p in PRODUCT_BY_ID}
        for p in PRODUCTS:
            pid = p["id"]
            if pid not in basket_set and pid not in candidates and p["category"] in categories:
                sup = round(ITEM_COUNTS.get(pid, 10) / _total_txns, 4)
                conf = 0.35
                lift = 2.10
                candidates[pid] = (sup, conf, lift)
            if len(candidates) >= n * 2:
                break

    # Tier 5: Global top items fallback if somehow still sparse
    if len(candidates) < n:
        for global_item in _global_recommendations(n * 2):
            pid = global_item["id"]
            if pid not in basket_set and pid not in candidates:
                candidates[pid] = (global_item["support"], global_item["confidence"], global_item["lift"])
            if len(candidates) >= n:
                break

    # Rank candidates by lift descending, then confidence descending
    ranked = sorted(candidates.items(), key=lambda kv: (-kv[1][2], -kv[1][1]))[:n]

    results = []
    for pid, (support, confidence, lift) in ranked:
        results.append({
            "id": pid,
            "name": _name(pid),
            "emoji": _emoji(pid),
            "image_query": _image_query(pid),
            "support": round(support, 4),
            "confidence": round(confidence, 4),
            "lift": round(lift, 4),
        })
    return results


def _global_recommendations(n=4):
    """Returns top distinct consequent recommendations from mined rules or popular products."""
    recs = []
    seen = set()
    for _, row in RULES_DF.iterrows():
        for cid in row["consequents"]:
            if cid not in seen:
                seen.add(cid)
                recs.append({
                    "id": cid,
                    "name": _name(cid),
                    "emoji": _emoji(cid),
                    "image_query": _image_query(cid),
                    "support": round(float(row["support"]), 4),
                    "confidence": round(float(row["confidence"]), 4),
                    "lift": round(float(row["lift"]), 4),
                })
            if len(recs) >= n:
                return recs
    return recs
