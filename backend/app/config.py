import os
from typing import List

class Settings:
    PROJECT_NAME: str = "HackJudge - Open, Self-Hosted Hackathon Management & Judging"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment & Database
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    # Default to sqlite locally if DATABASE_URL not set or empty
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hackathon.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-insecure-secret-key-change-in-production-2026-hackathon-dogfood")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Feature flags
    OFFLINE_MODE: bool = os.getenv("OFFLINE_MODE", "true").lower() in ("true", "1", "yes")
    AUTO_SEED: bool = os.getenv("AUTO_SEED", "true").lower() in ("true", "1", "yes")
    
    # CORS: Allow explicit origins only (wildcard * is insecure with credentials)
    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw_origins = os.getenv("CORS_ORIGINS")
        if raw_origins:
            try:
                import json
                return json.loads(raw_origins)
            except Exception:
                return [o.strip() for o in raw_origins.split(",") if o.strip()]
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:80",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://localhost"
        ]

    def __init__(self):
        if self.ENVIRONMENT == "production":
            insecure_defaults = [
                "dev-insecure-secret-key-change-in-production-2026-hackathon-dogfood",
                "CHANGE_ME", "secret", "password", "123456", "changeme"
            ]
            if not self.SECRET_KEY or any(self.SECRET_KEY.startswith(d) or self.SECRET_KEY == d for d in insecure_defaults):
                raise ValueError("SECURITY CONFIGURATION ERROR: In production mode, a cryptographically secure SECRET_KEY must be set in environment variables.")

settings = Settings()
