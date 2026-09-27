from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from sqlalchemy.orm import Session
from app.models import * # Ensure all models are registered
from app.seed.seed_data import seed_database

# Routers
from app.routers import (
    auth, users, events, teams, projects, submissions,
    judges, assignments, rubrics, scores, normalization,
    votes, comments, audit, exports, certificates, webhooks
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed fixtures if enabled
    Base.metadata.create_all(bind=engine)
    if settings.AUTO_SEED:
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-integrity, offline-capable Hackathon Management & Cross-Judge Normalization Platform.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Healthcheck
@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "offline_mode": settings.OFFLINE_MODE,
        "version": settings.VERSION
    }

# Mount Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(events.router, prefix=settings.API_V1_STR)
app.include_router(teams.router, prefix=settings.API_V1_STR)
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(submissions.router, prefix=settings.API_V1_STR)
app.include_router(judges.router, prefix=settings.API_V1_STR)
app.include_router(assignments.router, prefix=settings.API_V1_STR)
app.include_router(rubrics.router, prefix=settings.API_V1_STR)
app.include_router(scores.router, prefix=settings.API_V1_STR)
app.include_router(normalization.router, prefix=settings.API_V1_STR)
app.include_router(votes.router, prefix=settings.API_V1_STR)
app.include_router(comments.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(exports.router, prefix=settings.API_V1_STR)
app.include_router(certificates.router, prefix=settings.API_V1_STR)
app.include_router(webhooks.router, prefix=settings.API_V1_STR)

# Direct alias for /api/verify/{identifier}
from app.services.certificate_service import verify_certificate
from app.schemas.certificate import CertificateVerifyOut
@app.get("/api/verify/{identifier}", response_model=CertificateVerifyOut, tags=["Certificates"])
def verify_cert_direct(identifier: str, db: Session = Depends(get_db)):
    return verify_certificate(db, identifier)

# Mount static frontend build if present
import os
from fastapi.staticfiles import StaticFiles

static_dirs = [
    os.path.join(os.path.dirname(__file__), "../../frontend/dist"),
    os.path.join(os.getcwd(), "frontend/dist"),
    os.path.join(os.getcwd(), "dist")
]
for s_dir in static_dirs:
    if os.path.exists(s_dir) and os.path.exists(os.path.join(s_dir, "index.html")):
        app.mount("/", StaticFiles(directory=s_dir, html=True), name="frontend")
        break
