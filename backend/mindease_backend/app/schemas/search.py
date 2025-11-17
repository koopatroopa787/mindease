from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from app.schemas.screenshot import ScreenshotResponse


class SearchRequest(BaseModel):
    """Schema for search request"""
    query: str = Field(..., min_length=1)
    search_type: Literal["semantic", "keyword", "both"] = "both"
    collection_id: Optional[int] = None
    favorites_only: bool = False
    limit: int = Field(50, ge=1, le=100)


class SearchResult(BaseModel):
    """Schema for search result"""
    screenshot: ScreenshotResponse
    similarity_score: float
    match_type: str
    highlights: Optional[List[str]] = []


class SearchResponse(BaseModel):
    """Schema for search response"""
    results: List[SearchResult]
    total: int
    query: str
    search_type: str


class TagSearchRequest(BaseModel):
    """Schema for tag-based search"""
    tag_name: str
    limit: int = Field(50, ge=1, le=100)


class DateRangeSearchRequest(BaseModel):
    """Schema for date range search"""
    start_date: datetime
    end_date: datetime
    limit: int = Field(50, ge=1, le=100)


class RelatedScreenshotsRequest(BaseModel):
    """Schema for finding related screenshots"""
    screenshot_id: int
    limit: int = Field(10, ge=1, le=50)
