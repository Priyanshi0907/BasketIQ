from collections import Counter, defaultdict

from app.data.catalog import PRODUCT_BY_ID, CATEGORIES
from app.data.generator import TRANSACTIONS
from app.ml.classifier import get_models
from app.ml.association import get_rules_df, get_frequent_itemsets


def dashboard_summary():
    n_txn = len(TRANSACTIONS)
    basket_sizes = [len(t["items"]) for t in TRANSACTIONS]
    avg_basket_size = round(sum(basket_sizes) / n_txn, 2)

    item_counter = Counter()
    category_counter = Counter()
    for t in TRANSACTIONS:
        for pid in t["items"]:
            item_counter[pid] += 1
            p = PRODUCT_BY_ID.get(pid)
            if p:
                category_counter[p["category"]] += 1

    top_products = [
        {
            "id": pid,
            "name": PRODUCT_BY_ID.get(pid, {}).get("name", pid.replace("_", " ").title()),
            "emoji": PRODUCT_BY_ID.get(pid, {}).get("emoji", "🛒"),
            "image_query": PRODUCT_BY_ID.get(pid, {}).get("image_query", "grocery"),
            "category": PRODUCT_BY_ID.get(pid, {}).get("category", "General"),
            "count": count,
        }
        for pid, count in item_counter.most_common(8)
    ]

    category_breakdown = [
        {"category": c, "count": category_counter.get(c, 0)}
        for c in CATEGORIES
    ]
    category_breakdown.sort(key=lambda x: -x["count"])

    archetype_counter = Counter(t["archetype"] for t in TRANSACTIONS)
    intent_breakdown = [{"intent": k, "count": v} for k, v in archetype_counter.most_common()]

    # transactions per day for a trend line (last 30 days)
    by_date = defaultdict(int)
    for t in TRANSACTIONS:
        by_date[t["date"]] += 1
    trend = sorted(by_date.items())[-30:]
    trend = [{"date": d, "transactions": c} for d, c in trend]

    rules_df = get_rules_df()
    models = get_models()
    avg_lift = round(float(rules_df["lift"].mean()), 2) if not rules_df.empty else 0.0
    top_categories_count = sum(1 for c in category_breakdown if c["count"] > 0)

    return {
        "total_transactions": n_txn,
        "avg_basket_size": avg_basket_size,
        "unique_products": len(item_counter),
        "total_rules_mined": int(rules_df.shape[0]),
        "top_products": top_products,
        "category_breakdown": category_breakdown,
        "intent_breakdown": intent_breakdown,
        "trend": trend,
        "category_model_accuracy": models.category_accuracy,
        "intent_model_accuracy": models.intent_accuracy,
        "avg_lift": avg_lift,
        "top_categories_count": top_categories_count,
    }


def analytics_summary():
    basket_sizes = [len(t["items"]) for t in TRANSACTIONS]
    size_hist = Counter(basket_sizes)
    size_distribution = [{"size": s, "count": size_hist[s]} for s in sorted(size_hist)]

    rules_df = get_rules_df()
    frequent_itemsets = get_frequent_itemsets()
    models = get_models()

    lift_bins = {"1.0-1.5x": 0, "1.5-2.0x": 0, "2.0-2.5x": 0, "2.5x+": 0}
    for lift in rules_df["lift"]:
        if lift < 1.5:
            lift_bins["1.0-1.5x"] += 1
        elif lift < 2.0:
            lift_bins["1.5-2.0x"] += 1
        elif lift < 2.5:
            lift_bins["2.0-2.5x"] += 1
        else:
            lift_bins["2.5x+"] += 1
    lift_distribution = [{"bucket": k, "count": v} for k, v in lift_bins.items()]

    weekday_counter = Counter()
    from datetime import datetime
    for t in TRANSACTIONS:
        d = datetime.strptime(t["date"], "%Y-%m-%d")
        weekday_counter[d.strftime("%a")] += 1
    order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekday_pattern = [{"day": d, "count": weekday_counter.get(d, 0)} for d in order]

    return {
        "basket_size_distribution": size_distribution,
        "lift_distribution": lift_distribution,
        "weekday_pattern": weekday_pattern,
        "frequent_itemsets_count": int(frequent_itemsets.shape[0]),
        "rules_count": int(rules_df.shape[0]),
        "category_model_accuracy": models.category_accuracy,
        "intent_model_accuracy": models.intent_accuracy,
        "training_transactions": models.n_train,
    }
