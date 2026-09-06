from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import router as api_router
from app.api.auth import router as auth_router
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Seed if necessary
    try:
        init_db()
    except Exception as e:
        print(f"Warning: Database init encountered error: {e}")
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
