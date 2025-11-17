from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AudioRecordingBase(BaseModel):
    """Base audio recording schema"""
    screenshot_id: Optional[int] = None


class AudioRecordingCreate(AudioRecordingBase):
    """Schema for creating an audio recording"""
    pass


class AudioRecordingResponse(BaseModel):
    """Schema for audio recording response"""
    id: int
    user_id: int
    screenshot_id: Optional[int]
    file_path: str
    file_name: str
    file_size: Optional[int]
    mime_type: Optional[str]
    duration: Optional[int]
    transcription: Optional[str]
    summary: Optional[str]
    is_processed: bool
    recorded_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class AudioRecordingListResponse(BaseModel):
    """Response for list of audio recordings"""
    recordings: List[AudioRecordingResponse]
    total: int
    page: int
    page_size: int


class AudioSearchRequest(BaseModel):
    """Schema for audio search"""
    query: str = Field(..., min_length=1)
    limit: int = Field(20, ge=1, le=50)


class AudioSearchResult(BaseModel):
    """Schema for audio search result"""
    recording: AudioRecordingResponse
    similarity_score: float
    matched_text: Optional[str] = None
