import pytest
from app.db.models import User, ProductModel, Transaction, TransactionItem, AnalysisHistory, AppSetting
from app.core.security import get_password_hash


def test_create_and_query_user(db_session):
    user = User(
        email="dbuser@basketiq.io",
        full_name="DB Test User",
        hashed_password=get_password_hash("Secret123!"),
        role="user",
        avatar_initial="DT"
    )
    db_session.add(user)
    db_session.commit()

    fetched = db_session.query(User).filter(User.email == "dbuser@basketiq.io").first()
    assert fetched is not None
    assert fetched.full_name == "DB Test User"
    assert fetched.role == "user"


def test_transaction_relationship(db_session):
    txn = Transaction(
        id="TXN99999",
        date="2025-01-01",
        archetype="Breakfast & bakery",
        total_amount=150.0
    )
    db_session.add(txn)

    item1 = TransactionItem(transaction_id="TXN99999", product_id="bread", quantity=1, unit_price=40.0)
    item2 = TransactionItem(transaction_id="TXN99999", product_id="butter", quantity=1, unit_price=60.0)
    db_session.add(item1)
    db_session.add(item2)
    db_session.commit()

    fetched_txn = db_session.query(Transaction).filter(Transaction.id == "TXN99999").first()
    assert fetched_txn is not None
    assert len(fetched_txn.items) == 2
    assert fetched_txn.total_amount == 150.0


def test_analysis_history_persistence(db_session):
    hist = AnalysisHistory(
        input_text="Need bread and butter",
        primary_category="Dairy & Bakery",
        primary_confidence=0.95,
        intent="Breakfast preparation",
        intent_confidence=0.88,
        ai_headline="Great morning basket!"
    )
    hist.extracted_products = [{"id": "bread", "name": "Bread"}, {"id": "butter", "name": "Butter"}]
    db_session.add(hist)
    db_session.commit()

    fetched = db_session.query(AnalysisHistory).first()
    assert fetched is not None
    assert fetched.input_text == "Need bread and butter"
    assert len(fetched.extracted_products) == 2
