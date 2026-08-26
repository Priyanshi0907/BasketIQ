import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app.db.models import User, ProductModel, Transaction, TransactionItem
from app.core.security import get_password_hash, create_access_token
from app.main import app
from app.data.catalog import PRODUCTS

# Use an in-memory SQLite database for isolated test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed Products
    for p in PRODUCTS[:20]:
        db.add(ProductModel(
            id=p["id"],
            name=p["name"],
            category=p["category"],
            emoji=p.get("emoji", "🛒"),
            image_query=p.get("image_query", "grocery"),
            avg_price=float(p.get("avg_price", 50.0)),
        ))
    # Seed a Test User
    test_user = User(
        email="tester@basketiq.io",
        full_name="Test Runner",
        hashed_password=get_password_hash("TestPassword123!"),
        role="user",
        avatar_initial="TR",
        is_active=True
    )
    db.add(test_user)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(db_session):
    user = db_session.query(User).filter(User.email == "tester@basketiq.io").first()
    token = create_access_token(subject=user.id)
    return {"Authorization": f"Bearer {token}"}
