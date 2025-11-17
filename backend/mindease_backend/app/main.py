from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config.settings import get_settings
from app.config.database import Base, engine
from app.api.v1.api import api_router

settings = get_settings()

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Mount static files for uploaded content
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
