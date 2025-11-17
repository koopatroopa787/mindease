from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base


class Collection(Base):
    """Collection model for organizing screenshots"""
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String, nullable=True)  # Hex color code
    icon = Column(String, nullable=True)  # Icon identifier
    is_smart = Column(Boolean, default=False)  # Auto-populated based on rules
    smart_rules = Column(Text, nullable=True)  # JSON rules for smart collections

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="collections")
    screenshots = relationship("Screenshot", secondary="screenshot_collections", back_populates="collections")
