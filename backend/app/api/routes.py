import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, AnalysisHistory, Transaction, TransactionItem, ProductModel
from app.api.auth import get_current_user, get_current_user_optional
from app.data.catalog import PRODUCTS, CATEGORIES, PRODUCT_BY_ID
from app.data.generator import TRANSACTIONS
from app.ml.extractor import extract_products
from app.ml.classifier import MODELS
from app.ml.association import (
    rules_as_records, frequent_itemsets_as_records, top_associations_for, RULES_DF
)
from app.core.analytics import dashboard_summary, analytics_summary
from app.core.settings_store import get_settings, update_settings
from app.api.schemas import (
    AnalyzeRequest,
    SettingsPatch,
    TransactionCreateRequest,
    AnalysisHistoryResponse
)

router = APIRouter(prefix="/api")

EXAMPLES = {
    "Weekend breakfast": "I bought bread, butter, eggs and milk.",
    "Birthday party supplies": "Getting balloons, a cake, candles and paper plates for the party.",
    "Home decor items": "Need some candles, streamers and gift wrap for decorating.",
    "Cleaning day": "Picked up detergent, dish soap, floor cleaner and trash bags.",
    "Dinner tonight": "Buying chicken, onion, tomato, potato and some spices for dinner.",
}


@router.get("/health")
def health():
    return {"status": "ok", "service": "BasketIQ API"}


@router.get("/examples")
def examples():
    return EXAMPLES


@router.get("/products")
def products(db: Session = Depends(get_db)):
    # Fallback gracefully to catalog in memory or DB
    db_prods = db.query(ProductModel).all()
    if db_prods:
        prods_list = [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "emoji": p.emoji,
                "image_query": p.image_query,
                "avg_price": p.avg_price,
                "aliases": p.aliases
            }
            for p in db_prods
        ]
        cats = sorted(list(set(p.category for p in db_prods)))
        return {"products": prods_list, "categories": cats}
    return {"products": PRODUCTS, "categories": CATEGORIES}


@router.post("/analyze")
def analyze_basket(
    payload: AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Basket text cannot be empty.")
    if len(text) > 500:
        raise HTTPException(status_code=400, detail="Basket text too long (max 500 characters).")

    settings = get_settings()

    matched_products, extraction_confidence = extract_products(text)
    item_ids = [p["id"] for p in matched_products]

    classification = MODELS.classify(item_ids)
    associations = top_associations_for(item_ids, n=settings.get("recommendation_count", 4))

    assoc_names = ", ".join(a["name"] for a in associations[:3]) if associations else "related items"
    headline = f"Baskets like yours are often completed with items like {assoc_names}."
    insight = {
        "headline": headline,
        "reasons": [
            "Frequently bought together",
            "High confidence association rules",
            "Similar customer behavior",
        ],
    }

    # Persist to database
    try:
        history_record = AnalysisHistory(
            user_id=current_user.id if current_user else None,
            input_text=text,
            extracted_products_json=json.dumps(matched_products),
            primary_category=classification.get("primary_category"),
            primary_confidence=float(classification.get("primary_confidence", 0.0)),
            intent=classification.get("intent"),
            intent_confidence=float(classification.get("intent_confidence", 0.0)),
            ai_headline=headline
        )
        db.add(history_record)
        db.commit()
    except Exception as e:
        db.rollback()
        # Logging without blocking analysis response
        pass

    return {
        "input_text": text,
        "extracted_products": matched_products,
        "extraction_confidence": extraction_confidence,
        "classification": classification,
        "top_associations": associations,
        "ai_insight": insight,
    }


@router.get("/history", response_model=List[AnalysisHistoryResponse])
def get_history(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(AnalysisHistory)
    if current_user:
        query = query.filter((AnalysisHistory.user_id == current_user.id) | (AnalysisHistory.user_id == None))
    records = query.order_by(AnalysisHistory.created_at.desc()).limit(limit).all()

    return [
        {
            "id": r.id,
            "input_text": r.input_text,
            "extracted_products": r.extracted_products,
            "primary_category": r.primary_category,
            "primary_confidence": r.primary_confidence,
            "intent": r.intent,
            "intent_confidence": r.intent_confidence,
            "ai_headline": r.ai_headline,
            "created_at": r.created_at,
        }
        for r in records
    ]


@router.delete("/history/{history_id}")
def delete_history_item(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(AnalysisHistory).filter(AnalysisHistory.id == history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History record not found.")
    if item.user_id and item.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this record.")
    db.delete(item)
    db.commit()
    return {"status": "deleted", "id": history_id}


@router.post("/transactions")
def create_transaction(
    payload: TransactionCreateRequest,
    db: Session = Depends(get_db)
):
    valid_items = [pid for pid in payload.items if pid in PRODUCT_BY_ID]
    if not valid_items:
        raise HTTPException(status_code=400, detail="No valid product IDs in transaction.")

    import uuid
    from datetime import datetime
    txn_id = f"TXN{uuid.uuid4().hex[:8].upper()}"
    today_str = datetime.now().strftime("%Y-%m-%d")
    total = sum(PRODUCT_BY_ID.get(pid, {}).get("avg_price", 50.0) for pid in valid_items)

    txn = Transaction(
        id=txn_id,
        date=today_str,
        archetype=payload.archetype or "Custom Basket",
        total_amount=round(total, 2)
    )
    db.add(txn)
    for pid in valid_items:
        p_info = PRODUCT_BY_ID.get(pid, {})
        db.add(TransactionItem(
            transaction_id=txn_id,
            product_id=pid,
            quantity=1,
            unit_price=float(p_info.get("avg_price", 50.0))
        ))
    db.commit()
    return {"status": "created", "transaction_id": txn_id, "total_amount": total, "items_count": len(valid_items)}


@router.get("/dashboard")
def dashboard():
    return dashboard_summary()


@router.get("/analytics")
def analytics():
    return analytics_summary()


@router.get("/rules")
def rules(limit: int = Query(50, le=500), min_lift: float = Query(0.0)):
    return {"rules": rules_as_records(limit=limit, min_lift=min_lift), "total": int(RULES_DF.shape[0])}


@router.get("/itemsets")
def itemsets(limit: int = Query(50, le=500)):
    return {"itemsets": frequent_itemsets_as_records(limit=limit)}


@router.get("/recommendations")
def recommendations(items: Optional[str] = Query(None, description="comma separated product ids")):
    settings = get_settings()
    n = settings.get("recommendation_count", 4)
    if items:
        item_ids = [i.strip() for i in items.split(",") if i.strip()]
        recs = top_associations_for(item_ids, n=n)
        basis = item_ids
    else:
        recs = []
        seen = set()
        for r in rules_as_records(limit=100):
            for cid, cname in zip(r["consequent_ids"], r["consequents"]):
                if cid in seen:
                    continue
                seen.add(cid)
                recs.append({
                    "id": cid, "name": cname,
                    "emoji": PRODUCT_BY_ID.get(cid, {}).get("emoji", "🛒"),
                    "image_query": PRODUCT_BY_ID.get(cid, {}).get("image_query", "grocery"),
                    "support": r["support"], "confidence": r["confidence"], "lift": r["lift"],
                })
            if len(recs) >= n * 3:
                break
        recs = recs[: n * 2]
        basis = []
    return {"basis_items": basis, "recommendations": recs}


@router.get("/customer-insights")
def customer_insights():
    """Product popularity, co-occurrence and category relationships."""
    from collections import Counter, defaultdict

    popularity = Counter()
    co_occurrence = defaultdict(Counter)
    for t in TRANSACTIONS:
        items = t["items"]
        for pid in items:
            popularity[pid] += 1
        for i, a in enumerate(items):
            for b in items[i + 1:]:
                co_occurrence[a][b] += 1
                co_occurrence[b][a] += 1

    def _p_info(pid: str):
        return PRODUCT_BY_ID.get(pid, {
            "id": pid,
            "name": pid.replace("_", " ").title(),
            "emoji": "🛒",
            "image_query": pid.replace("_", ","),
            "category": "Daily Essentials",
            "avg_price": 50.0
        })

    top_popular = [
        {"id": pid, "name": _p_info(pid)["name"], "emoji": _p_info(pid).get("emoji", "🛒"),
         "image_query": _p_info(pid).get("image_query", "grocery"),
         "category": _p_info(pid).get("category", "General"), "purchases": cnt}
        for pid, cnt in popularity.most_common(10)
    ]

    co_pairs = []
    seen_pairs = set()
    for a, counter in co_occurrence.items():
        for b, cnt in counter.most_common(1):
            pair = tuple(sorted([a, b]))
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)
            p_a = _p_info(a)
            p_b = _p_info(b)
            co_pairs.append({
                "a": p_a["name"], "b": p_b["name"], "count": cnt,
                "a_image_query": p_a.get("image_query", "grocery"),
                "b_image_query": p_b.get("image_query", "grocery"),
            })
    co_pairs.sort(key=lambda x: -x["count"])

    settings = get_settings()
    return {
        "top_popular": top_popular,
        "top_co_occurring": co_pairs[:10],
        "dataset_note": {
            "transactions": len(TRANSACTIONS),
            "products": len(PRODUCTS),
            "dataset_name": settings.get("dataset", "Synthetic Retail Transactions"),
        },
    }


@router.get("/settings")
def read_settings():
    return get_settings()


@router.patch("/settings")
def patch_settings(patch: SettingsPatch):
    return update_settings(patch.dict(exclude_unset=True))
