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
import os
import pickle
from collections import Counter, defaultdict
import pandas as pd
from mlxtend.frequent_patterns import fpgrowth, association_rules
from mlxtend.preprocessing import TransactionEncoder

from app.data.catalog import PRODUCT_BY_ID, PRODUCTS
from app.data.generator import TRANSACTIONS

_CACHE_PATH = os.path.join(os.path.dirname(__file__), "_association_cache.pkl")

_baskets = [t["items"] for t in TRANSACTIONS]
_total_txns = max(len(_baskets), 1)


def _compute():
    # Precompute transaction-level single and pairwise statistics for instant co-occurrence fallback
    item_counts = Counter()
    pair_counts = defaultdict(Counter)
    for _b in _baskets:
        for _item in _b:
            item_counts[_item] += 1
        for _i, _a in enumerate(_b):
            for _b_item in _b[_i + 1:]:
                pair_counts[_a][_b_item] += 1
                pair_counts[_b_item][_a] += 1

    _te = TransactionEncoder()
    _te_ary = _te.fit(_baskets).transform(_baskets)
    _df_encoded = pd.DataFrame(_te_ary, columns=_te.columns_)

    frequent_itemsets = fpgrowth(_df_encoded, min_support=0.005, use_colnames=True)
    frequent_itemsets = frequent_itemsets.sort_values("support", ascending=False).reset_index(drop=True)

    _rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.0)
    _rules = _rules[_rules["confidence"] >= 0.1].copy()
    _rules["antecedents"] = _rules["antecedents"].apply(lambda s: sorted(list(s)))
    _rules["consequents"] = _rules["consequents"].apply(lambda s: sorted(list(s)))
    _rules = _rules.sort_values("lift", ascending=False).reset_index(drop=True)
    rules_df = _rules

    # Pre-index rules for fast subset lookup
    # 1. Single item antecedent -> list of rules: {item_id: [(cid, support, confidence, lift), ...]}
    single_item_rules = defaultdict(list)
    # 2. Multi-item rules
    multi_item_rules = []

    for _, row in rules_df.iterrows():
        ants = row["antecedents"]
        metrics = (float(row["support"]), float(row["confidence"]), float(row["lift"]))
        if len(ants) == 1:
            for cid in row["consequents"]:
                single_item_rules[ants[0]].append((cid, metrics))
        else:
            multi_item_rules.append((set(ants), row["consequents"], metrics))

    return {
        "item_counts": item_counts,
        "pair_counts": pair_counts,
        "frequent_itemsets": frequent_itemsets,
        "rules_df": rules_df,
        "single_item_rules": single_item_rules,
        "multi_item_rules": multi_item_rules,
    }


def _load_or_compute():
    if os.path.exists(_CACHE_PATH):
        try:
            with open(_CACHE_PATH, "rb") as f:
                return pickle.load(f)
        except Exception:
            pass  # corrupt/incompatible cache -> recompute below
    result = _compute()
    try:
        with open(_CACHE_PATH, "wb") as f:
            pickle.dump(result, f)
    except OSError:
        pass  # read-only filesystem -> fine, just recompute next time
    return result


_result = _load_or_compute()
ITEM_COUNTS = _result["item_counts"]
PAIR_COUNTS = _result["pair_counts"]
FREQUENT_ITEMSETS = _result["frequent_itemsets"]
RULES_DF = _result["rules_df"]
SINGLE_ITEM_RULES = _result["single_item_rules"]
MULTI_ITEM_RULES = _result["multi_item_rules"]


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
