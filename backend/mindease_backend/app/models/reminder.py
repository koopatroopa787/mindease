from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ARRAY
from app.config.database import Base


class AudioRecording(Base):
    """Audio recording model for voice memos attached to screenshots"""
    __tablename__ = "audio_recordings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    screenshot_id = Column(Integer, ForeignKey("screenshots.id", ondelete="CASCADE"), nullable=True)

    # File information
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer)  # in bytes
    mime_type = Column(String)
    duration = Column(Integer)  # in seconds

    # Transcription and analysis
    transcription = Column(Text)  # Speech-to-text result
    summary = Column(Text)  # AI-generated summary
    transcription_embedding = Column(ARRAY(Float))  # Vector embedding for search
    is_processed = Column(Boolean, default=False)

    # Timestamps
    recorded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="audio_recordings")
    screenshot = relationship("Screenshot", back_populates="audio_recordings")


# Keep for backwards compatibility, can be used for reminder features later
class Reminder(Base):
    """Reminder model for scheduled notifications"""
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    screenshot_id = Column(Integer, ForeignKey("screenshots.id", ondelete="SET NULL"), nullable=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    remind_at = Column(DateTime(timezone=True), nullable=False)
    is_completed = Column(Boolean, default=False)
    is_recurring = Column(Boolean, default=False)
    recurrence_rule = Column(String, nullable=True)  # iCal RRULE format

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
