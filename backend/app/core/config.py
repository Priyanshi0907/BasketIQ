import os
import warnings
from typing import List
from pydantic_settings import BaseSettings

# This is a placeholder ONLY. It intentionally will not "look like" a real
# secret so it can never be mistaken for one and accidentally used in
# production. Always override SECRET_KEY via a .env file or real
# environment variable outside of source control.
INSECURE_DEFAULT_SECRET_KEY = "CHANGE_ME_INSECURE_DEFAULT_DO_NOT_USE_IN_PRODUCTION"


class Settings(BaseSettings):
    PROJECT_NAME: str = "BasketIQ API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # Security / Auth
    SECRET_KEY: str = INSECURE_DEFAULT_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # Default is SQLite local file in backend/data/basketiq.db; supports postgresql://...
    DATABASE_URL: str = "sqlite:///./data/basketiq.db"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://basketiq.vercel.app",
    ]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"


settings = Settings()

if settings.ENVIRONMENT.lower() == "production" and settings.SECRET_KEY == INSECURE_DEFAULT_SECRET_KEY:
    warnings.warn(
        "SECURITY WARNING: ENVIRONMENT is 'production' but SECRET_KEY is still the "
        "insecure default. Set a real SECRET_KEY via environment variable or .env "
        "before deploying (e.g. `openssl rand -hex 32`). JWTs signed with the "
        "default key are forgeable by anyone who has read this source code.",
        stacklevel=1,
    )
