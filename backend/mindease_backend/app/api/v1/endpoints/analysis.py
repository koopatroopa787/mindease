from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime

from app.config.database import get_db
from app.models import AudioRecording, User, Screenshot
from app.schemas import AudioRecordingResponse, AudioRecordingListResponse, AudioSearchRequest
from app.services.storage_service import StorageService
from app.services.ai_service import AIService
from app.api.v1.endpoints.screenshots import get_current_user

router = APIRouter()


async def process_audio_async(
    recording_id: int,
    file_path: str,
    db: Session
):
    """Background task to transcribe and analyze audio"""
    try:
        ai_service = AIService()
        
        # Transcribe audio
        transcription = await ai_service.transcribe_audio(file_path)
        
        # Generate summary
        summary = await ai_service.summarize_text(transcription) if transcription else ""
        
        # Generate embedding
        embedding = await ai_service.generate_embedding(transcription) if transcription else []
        
        # Update recording in database
        recording = db.query(AudioRecording).filter(AudioRecording.id == recording_id).first()
        if recording:
            recording.transcription = transcription
            recording.summary = summary
            recording.transcription_embedding = embedding
            recording.is_processed = True
            db.commit()
    except Exception as e:
        print(f"Error processing audio {recording_id}: {e}")


@router.post("/upload", response_model=AudioRecordingResponse, status_code=201)
async def upload_audio_recording(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    screenshot_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload an audio recording"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Validate screenshot if provided
        if screenshot_id:
            screenshot = (
                db.query(Screenshot)
                .filter(Screenshot.id == screenshot_id, Screenshot.user_id == current_user.id)
                .first()
            )
            if not screenshot:
                raise HTTPException(status_code=404, detail="Screenshot not found")
        
        # Save file
        storage_service = StorageService()
        file_path, file_name = storage_service.save_audio(file.file, file.filename)
        file_size = storage_service.get_file_size(file_path)
        
        # Create recording record
        recording = AudioRecording(
            user_id=current_user.id,
            screenshot_id=screenshot_id,
            file_path=file_path,
            file_name=file_name,
            file_size=file_size,
            mime_type=file.content_type,
            recorded_at=datetime.now(),
            is_processed=False
        )
        
        db.add(recording)
        db.commit()
        db.refresh(recording)
        
        # Process audio in background
        background_tasks.add_task(
            process_audio_async,
            recording.id,
            file_path,
            db
        )
        
        return recording
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading audio: {str(e)}")


@router.get("/", response_model=AudioRecordingListResponse)
def get_audio_recordings(
    skip: int = 0,
    limit: int = 50,
    screenshot_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of audio recordings"""
    query = db.query(AudioRecording).filter(AudioRecording.user_id == current_user.id)
    
    if screenshot_id:
        query = query.filter(AudioRecording.screenshot_id == screenshot_id)
    
    total = query.count()
    recordings = query.order_by(AudioRecording.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "recordings": recordings,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit
    }


@router.get("/{recording_id}", response_model=AudioRecordingResponse)
def get_audio_recording(
    recording_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audio recording by ID"""
    recording = (
        db.query(AudioRecording)
        .filter(AudioRecording.id == recording_id, AudioRecording.user_id == current_user.id)
        .first()
    )
    
    if not recording:
        raise HTTPException(status_code=404, detail="Audio recording not found")
    
    return recording


@router.delete("/{recording_id}", status_code=204)
def delete_audio_recording(
    recording_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete audio recording"""
    recording = (
        db.query(AudioRecording)
        .filter(AudioRecording.id == recording_id, AudioRecording.user_id == current_user.id)
        .first()
    )
    
    if not recording:
        raise HTTPException(status_code=404, detail="Audio recording not found")
    
    # Delete file
    storage_service = StorageService()
    storage_service.delete_file(recording.file_path)
    
    # Delete from database
    db.delete(recording)
    db.commit()
    
    return None
