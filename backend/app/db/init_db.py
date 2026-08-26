import json
import logging
from sqlalchemy.orm import Session

from app.db.session import engine, Base, SessionLocal
from app.db.models import User, ProductModel, Transaction, TransactionItem, AppSetting
from app.core.security import get_password_hash
from app.data.catalog import PRODUCTS, PRODUCT_BY_ID
from app.data.generator import generate_transactions

logger = logging.getLogger("basketiq.db")


def init_db(force_refresh_transactions: bool = False):
    """Initializes tables, syncs product catalog, and seeds initial data."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # 1. Seed Demo User
        demo_email = "demo@basketiq.io"
        existing_demo = db.query(User).filter(User.email == demo_email).first()
        if not existing_demo:
            demo_user = User(
                email=demo_email,
                full_name="Priyanshi",
                hashed_password=get_password_hash("BasketIQ2025!"),
                role="admin",
                avatar_initial="P",
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            logger.info("Seeded demo user: %s", demo_email)

        # 2. Synchronize Products
        existing_pids = {p.id for p in db.query(ProductModel.id).all()}
        new_products = []
        updated_count = 0

        for p in PRODUCTS:
            pid = p["id"]
            if pid not in existing_pids:
                pm = ProductModel(
                    id=pid,
                    name=p["name"],
                    category=p["category"],
                    emoji=p.get("emoji", "🛒"),
                    image_query=p.get("image_query", "grocery"),
                    avg_price=float(p.get("avg_price", 50.0)),
                    aliases_json=json.dumps(p.get("aliases", []))
                )
                new_products.append(pm)
            else:
                # Update existing product metadata to ensure latest aliases and details
                db.query(ProductModel).filter(ProductModel.id == pid).update({
                    "name": p["name"],
                    "category": p["category"],
                    "emoji": p.get("emoji", "🛒"),
                    "image_query": p.get("image_query", "grocery"),
                    "avg_price": float(p.get("avg_price", 50.0)),
                    "aliases_json": json.dumps(p.get("aliases", []))
                })
                updated_count += 1

        if new_products:
            db.bulk_save_objects(new_products)
            logger.info("Added %d new products to catalog.", len(new_products))
        db.commit()
        logger.info("Product catalog synchronized: %d total products in DB.", db.query(ProductModel).count())

        # 3. Seed / Refresh Transactions if needed
        txn_count = db.query(Transaction).count()
        if txn_count == 0 or force_refresh_transactions or len(new_products) > 10:
            logger.info("Seeding/refreshing realistic transaction history into database...")
            # Clean old items if refreshing
            db.query(TransactionItem).delete()
            db.query(Transaction).delete()
            db.commit()

            raw_txns = generate_transactions(n=4000)
            db_txns = []
            db_items = []
            for t in raw_txns:
                total_val = sum(PRODUCT_BY_ID.get(pid, {}).get("avg_price", 50.0) for pid in t["items"])
                txn = Transaction(
                    id=t["id"],
                    date=t["date"],
                    archetype=t["archetype"],
                    total_amount=round(total_val, 2)
                )
                db_txns.append(txn)
                for pid in t["items"]:
                    p_info = PRODUCT_BY_ID.get(pid, {})
                    db_items.append(TransactionItem(
                        transaction_id=t["id"],
                        product_id=pid,
                        quantity=1,
                        unit_price=float(p_info.get("avg_price", 50.0))
                    ))
            db.bulk_save_objects(db_txns)
            db.bulk_save_objects(db_items)
            db.commit()
            logger.info("Successfully seeded %d transactions into database.", len(db_txns))

        # 4. Seed Settings
        existing_setting = db.query(AppSetting).filter(AppSetting.key == "global_config").first()
        if not existing_setting:
            defaults = {
                "dataset": "BasketIQ Indian-Market Retail DB (Persistent)",
                "min_support": 0.02,
                "min_confidence": 0.2,
                "min_lift": 1.05,
                "fuzzy_match_threshold": 82,
                "recommendation_count": 4,
                "theme": "earthy",
                "model_version": "basketiq-nlp-v2.0",
            }
            db.add(AppSetting(key="global_config", value_json=json.dumps(defaults)))
            db.commit()

    except Exception as e:
        db.rollback()
        logger.error("Error during database initialization: %s", e)
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    init_db(force_refresh_transactions=True)
    print("Database initialization complete.")
