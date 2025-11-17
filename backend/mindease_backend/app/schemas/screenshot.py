from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ScreenshotBase(BaseModel):
    """Base screenshot schema"""
    is_favorite: bool = False


class ScreenshotCreate(ScreenshotBase):
    """Schema for creating a screenshot"""
    pass


class ScreenshotUpdate(BaseModel):
    """Schema for updating a screenshot"""
    is_favorite: Optional[bool] = None
    tags: Optional[List[str]] = None
    collections: Optional[List[int]] = None


class TagSchema(BaseModel):
    """Schema for tag"""
    id: int
    name: str
    color: Optional[str] = None

    class Config:
        from_attributes = True


class ScreenshotResponse(BaseModel):
    """Schema for screenshot response"""
    id: int
    user_id: int
    file_path: str
    file_name: str
    file_size: Optional[int]
    mime_type: Optional[str]
    width: Optional[int]
    height: Optional[int]
    ocr_text: Optional[str]
    ai_description: Optional[str]
    ai_tags: Optional[List[str]]
    location: Optional[str]
    is_favorite: bool
    is_processed: bool
    captured_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    tags: List[TagSchema] = []

    class Config:
        from_attributes = True


class ScreenshotDetailResponse(ScreenshotResponse):
    """Detailed screenshot response with analysis"""
    ai_metadata: Optional[dict]
    text_regions: Optional[List[dict]] = []


class ScreenshotListResponse(BaseModel):
    """Response for list of screenshots"""
    screenshots: List[ScreenshotResponse]
    total: int
    page: int
    page_size: int


class AnalysisResponse(BaseModel):
    """Schema for analysis results"""
    main_description: Optional[str]
    detailed_description: Optional[str]
    detected_objects: Optional[dict]
    scene_type: Optional[str]
    content_category: Optional[str]
    content_type: Optional[str]
    sentiment: Optional[str]
    sentiment_score: Optional[float]
    entities: Optional[dict]
    confidence_score: Optional[float]

    class Config:
        from_attributes = True
