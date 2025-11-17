from fastapi import APIRouter
from app.api.v1.endpoints import screenshots, collections, search, analysis

api_router = APIRouter()

api_router.include_router(screenshots.router, prefix="/screenshots", tags=["screenshots"])
api_router.include_router(collections.router, prefix="/collections", tags=["collections"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(analysis.router, prefix="/audio", tags=["audio"])
