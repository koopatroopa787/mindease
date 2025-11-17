from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ARRAY
from app.config.database import Base


class Screenshot(Base):
    """Screenshot model with AI analysis and metadata"""
    __tablename__ = "screenshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # File information
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer)  # in bytes
    mime_type = Column(String)
    width = Column(Integer)
    height = Column(Integer)

    # Content extraction
    ocr_text = Column(Text)  # Extracted text from OCR
    ai_description = Column(Text)  # AI-generated description
    ai_tags = Column(ARRAY(String))  # AI-generated tags
    ai_metadata = Column(JSON)  # Additional AI analysis data

    # Embeddings for semantic search
    text_embedding = Column(ARRAY(Float))  # Vector embedding of text
    image_embedding = Column(ARRAY(Float))  # Vector embedding of image

    # Metadata
    location = Column(String)  # Extracted location if available
    temporal_data = Column(DateTime(timezone=True))  # Extracted date/time if available
    is_favorite = Column(Boolean, default=False)
    is_processed = Column(Boolean, default=False)  # AI processing status

    # Timestamps
    captured_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="screenshots")
    tags = relationship("Tag", secondary="screenshot_tags", back_populates="screenshots")
    collections = relationship("Collection", secondary="screenshot_collections", back_populates="screenshots")
    audio_recordings = relationship("AudioRecording", back_populates="screenshot")
    analysis = relationship("Analysis", back_populates="screenshot", uselist=False, cascade="all, delete-orphan")


class Tag(Base):
    """Tag model for organizing content"""
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    color = Column(String, nullable=True)  # Hex color code
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    screenshots = relationship("Screenshot", secondary="screenshot_tags", back_populates="tags")


class ScreenshotTag(Base):
    """Association table for screenshots and tags"""
    __tablename__ = "screenshot_tags"

    screenshot_id = Column(Integer, ForeignKey("screenshots.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ScreenshotCollection(Base):
    """Association table for screenshots and collections"""
    __tablename__ = "screenshot_collections"

    screenshot_id = Column(Integer, ForeignKey("screenshots.id", ondelete="CASCADE"), primary_key=True)
    collection_id = Column(Integer, ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True)
    position = Column(Integer, default=0)  # For ordering within collection
    created_at = Column(DateTime(timezone=True), server_default=func.now())
