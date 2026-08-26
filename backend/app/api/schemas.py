from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ---- Auth Schemas ----
class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class SocialLoginRequest(BaseModel):
    provider: str = Field(..., description="Google, Apple, Microsoft, etc.")
    email: EmailStr
    name: Optional[str] = "User"
    provider_id: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    initial: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


class UserUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=6, max_length=128)


# ---- NLP & Analysis Schemas ----
class AnalyzeRequest(BaseModel):
    text: str


class SettingsPatch(BaseModel):
    model_config = {"protected_namespaces": ()}

    dataset: Optional[str] = None
    min_support: Optional[float] = None
    min_confidence: Optional[float] = None
    min_lift: Optional[float] = None
    fuzzy_match_threshold: Optional[int] = None
    recommendation_count: Optional[int] = None
    theme: Optional[str] = None
    model_version: Optional[str] = None


class TransactionCreateRequest(BaseModel):
    items: List[str] = Field(..., min_length=1)
    archetype: Optional[str] = "Custom Basket"


class AnalysisHistoryResponse(BaseModel):
    id: int
    input_text: str
    extracted_products: List[Dict[str, Any]]
    primary_category: Optional[str] = None
    primary_confidence: float
    intent: Optional[str] = None
    intent_confidence: float
    ai_headline: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
