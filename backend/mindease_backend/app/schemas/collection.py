from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CollectionBase(BaseModel):
    """Base collection schema"""
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class CollectionCreate(CollectionBase):
    """Schema for creating a collection"""
    is_smart: bool = False
    smart_rules: Optional[str] = None


class CollectionUpdate(BaseModel):
    """Schema for updating a collection"""
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    smart_rules: Optional[str] = None


class CollectionResponse(CollectionBase):
    """Schema for collection response"""
    id: int
    user_id: int
    is_smart: bool
    created_at: datetime
    updated_at: Optional[datetime]
    screenshot_count: int = 0

    class Config:
        from_attributes = True


class CollectionDetailResponse(CollectionResponse):
    """Detailed collection response with screenshots"""
    screenshots: List[dict] = []


class CollectionListResponse(BaseModel):
    """Response for list of collections"""
    collections: List[CollectionResponse]
    total: int


class AddScreenshotsRequest(BaseModel):
    """Schema for adding screenshots to collection"""
    screenshot_ids: List[int]


class RemoveScreenshotsRequest(BaseModel):
    """Schema for removing screenshots from collection"""
    screenshot_ids: List[int]
