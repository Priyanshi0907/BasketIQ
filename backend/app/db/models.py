import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)
    avatar_initial = Column(String(10), default="U")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    analysis_history = relationship("AnalysisHistory", back_populates="user", cascade="all, delete-orphan")


class ProductModel(Base):
    __tablename__ = "products"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    emoji = Column(String(20), default="🛒")
    image_query = Column(String(100), default="grocery")
    avg_price = Column(Float, default=50.0)
    aliases_json = Column(Text, default="[]")  # stored as JSON array string

    @property
    def aliases(self):
        try:
            return json.loads(self.aliases_json or "[]")
        except Exception:
            return []

    @aliases.setter
    def aliases(self, val):
        self.aliases_json = json.dumps(val or [])


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(100), primary_key=True, index=True)
    date = Column(String(20), nullable=False, index=True)
    archetype = Column(String(255), nullable=False, index=True)
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    items = relationship("TransactionItem", back_populates="transaction", cascade="all, delete-orphan")


class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(String(100), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(100), nullable=False, index=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)

    # Relationships
    transaction = relationship("Transaction", back_populates="items")


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    input_text = Column(Text, nullable=False)
    extracted_products_json = Column(Text, default="[]")  # JSON array
    primary_category = Column(String(100), nullable=True)
    primary_confidence = Column(Float, default=0.0)
    intent = Column(String(100), nullable=True)
    intent_confidence = Column(Float, default=0.0)
    ai_headline = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="analysis_history")

    @property
    def extracted_products(self):
        try:
            return json.loads(self.extracted_products_json or "[]")
        except Exception:
            return []

    @extracted_products.setter
    def extracted_products(self, val):
        self.extracted_products_json = json.dumps(val or [])


class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True, index=True)
    value_json = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    @property
    def value(self):
        try:
            return json.loads(self.value_json)
        except Exception:
            return self.value_json

    @value.setter
    def value(self, val):
        self.value_json = json.dumps(val)
