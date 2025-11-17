from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings and configuration"""

    # Application
    APP_NAME: str = "MindEase"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://mindspace_user:dev123@localhost:5433/mindspace_db"
    DB_ECHO_LOG: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600  # 1 hour

    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}
    ALLOWED_AUDIO_EXTENSIONS: set = {".mp3", ".wav", ".m4a", ".ogg"}

    # Audio Recording
    MAX_AUDIO_DURATION: int = 60  # seconds

    # AI Services
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    USE_AI_PROVIDER: str = "openai"  # "openai" or "anthropic"

    # Vision Model for Screenshot Analysis
    VISION_MODEL: str = "gpt-4o"  # or "claude-3-5-sonnet-20241022"

    # Embedding Model for Semantic Search
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536

    # OCR
    TESSERACT_CMD: Optional[str] = None  # Path to tesseract executable
    OCR_LANGUAGES: str = "eng"

    # Search
    SEARCH_RESULTS_LIMIT: int = 50
    SIMILARITY_THRESHOLD: float = 0.7

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
