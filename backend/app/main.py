import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import router as api_router
from app.api.auth import router as auth_router
from app.db.init_db import init_db


def _warmup():
    """Pre-load ML models and association rules in a background thread so the
    first real user request is served instantly. The app binds its port before
    this runs, so deployment health-checks pass immediately."""
    try:
        from app.ml.classifier import get_models
        from app.ml.association import _ensure_loaded
        print("INFO:     [warmup] Starting ML pre-load in background thread...")
        get_models()
        print("INFO:     [warmup] Classifier ready.")
        _ensure_loaded()
        print("INFO:     [warmup] Association rules ready. ML warmup complete.")
    except Exception as e:
        print(f"WARNING:  [warmup] ML pre-load failed (will load on first request): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Seed if necessary
    try:
        init_db()
    except Exception as e:
        print(f"Warning: Database init encountered error: {e}")

    # Kick off ML warmup immediately in a background thread so the app
    # can bind its port right away (important for Render / cloud deploys).
    threading.Thread(target=_warmup, daemon=True, name="ml-warmup").start()

    yield
    # Shutdown logic if any


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="NLP-powered market basket analysis: extraction, classification, "
                "association rule mining, persistence, and recommendations.",
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "BasketIQ API is running.",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/api/health"
    }

