from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base


class Analysis(Base):
    """Analysis model for storing detailed AI analysis results"""
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    screenshot_id = Column(Integer, ForeignKey("screenshots.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Vision AI Analysis
    main_description = Column(Text)
    detailed_description = Column(Text)
    detected_objects = Column(JSON)  # List of detected objects with confidence scores
    detected_text_regions = Column(JSON)  # Text regions with bounding boxes
    scene_type = Column(String)  # e.g., "document", "website", "chat", "code"

    # Content Classification
    content_category = Column(String)  # e.g., "work", "personal", "entertainment"
    content_type = Column(String)  # e.g., "email", "social_media", "document"
    sentiment = Column(String)  # "positive", "negative", "neutral"
    sentiment_score = Column(Float)

    # Extracted Entities
    entities = Column(JSON)  # Named entities (people, places, organizations)
    urls = Column(JSON)  # Extracted URLs
    email_addresses = Column(JSON)  # Extracted email addresses
    phone_numbers = Column(JSON)  # Extracted phone numbers
    dates = Column(JSON)  # Extracted dates

    # Quality Metrics
    confidence_score = Column(Float)  # Overall analysis confidence
    processing_time = Column(Float)  # Time taken for analysis in seconds

    # Timestamps
    analyzed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    screenshot = relationship("Screenshot", back_populates="analysis")
