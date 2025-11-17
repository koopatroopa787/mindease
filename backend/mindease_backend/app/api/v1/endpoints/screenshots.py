from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import shutil

from app.config.database import get_db
from app.models import Screenshot, User
from app.schemas import (
    ScreenshotResponse,
    ScreenshotDetailResponse,
    ScreenshotListResponse,
    ScreenshotUpdate,
)
from app.services.storage_service import StorageService
from app.services.ai_service import AIService
from app.services.ocr_service import OCRService

router = APIRouter()


def get_current_user(db: Session = Depends(get_db)) -> User:
    """Mock user authentication - replace with actual auth"""
    user = db.query(User).first()
    if not user:
        # Create default user for development
        user = User(
            email="user@mindease.com",
            username="default_user",
            hashed_password="hashed",
            full_name="Default User"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


async def process_screenshot_async(
    screenshot_id: int,
    file_path: str,
    db: Session
):
    """Background task to process screenshot with AI and OCR"""
    try:
        ocr_service = OCRService()
        ai_service = AIService()
        
        # Extract text using OCR
        ocr_result = ocr_service.extract_text(file_path)
        ocr_text = ocr_result.get("text", "")
        
        # Analyze with AI
        ai_analysis = await ai_service.analyze_screenshot(file_path, ocr_text)
        
        # Generate embeddings
        combined_text = f"{ocr_text} {ai_analysis.get('description', '')}"
        text_embedding = await ai_service.generate_embedding(combined_text)
        
        # Update screenshot in database
        screenshot = db.query(Screenshot).filter(Screenshot.id == screenshot_id).first()
        if screenshot:
            screenshot.ocr_text = ocr_text
            screenshot.ai_description = ai_analysis.get("description", "")
            screenshot.ai_tags = ai_analysis.get("tags", [])
            screenshot.ai_metadata = ai_analysis
            screenshot.text_embedding = text_embedding
            screenshot.is_processed = True
            db.commit()
    except Exception as e:
        print(f"Error processing screenshot {screenshot_id}: {e}")


@router.post("/upload", response_model=ScreenshotResponse, status_code=201)
async def upload_screenshot(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a new screenshot"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save file
        storage_service = StorageService()
        file_path, file_name = storage_service.save_screenshot(file.file, file.filename)
        file_size = storage_service.get_file_size(file_path)
        
        # Get image dimensions
        from PIL import Image
        with Image.open(file_path) as img:
            width, height = img.size
        
        # Create screenshot record
        screenshot = Screenshot(
            user_id=current_user.id,
            file_path=file_path,
            file_name=file_name,
            file_size=file_size,
            mime_type=file.content_type,
            width=width,
            height=height,
            captured_at=datetime.now(),
            is_processed=False
        )
        
        db.add(screenshot)
        db.commit()
        db.refresh(screenshot)
        
        # Process screenshot in background
        background_tasks.add_task(
            process_screenshot_async,
            screenshot.id,
            file_path,
            db
        )
        
        return screenshot
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading screenshot: {str(e)}")


@router.get("/", response_model=ScreenshotListResponse)
def get_screenshots(
    skip: int = 0,
    limit: int = 50,
    favorites_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of screenshots"""
    query = db.query(Screenshot).filter(Screenshot.user_id == current_user.id)
    
    if favorites_only:
        query = query.filter(Screenshot.is_favorite == True)
    
    total = query.count()
    screenshots = query.order_by(Screenshot.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "screenshots": screenshots,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit
    }


@router.get("/{screenshot_id}", response_model=ScreenshotDetailResponse)
def get_screenshot(
    screenshot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get screenshot by ID"""
    screenshot = (
        db.query(Screenshot)
        .filter(Screenshot.id == screenshot_id, Screenshot.user_id == current_user.id)
        .first()
    )
    
    if not screenshot:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    
    return screenshot


@router.patch("/{screenshot_id}", response_model=ScreenshotResponse)
def update_screenshot(
    screenshot_id: int,
    update_data: ScreenshotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update screenshot"""
    screenshot = (
        db.query(Screenshot)
        .filter(Screenshot.id == screenshot_id, Screenshot.user_id == current_user.id)
        .first()
    )
    
    if not screenshot:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    
    if update_data.is_favorite is not None:
        screenshot.is_favorite = update_data.is_favorite
    
    db.commit()
    db.refresh(screenshot)
    
    return screenshot


@router.delete("/{screenshot_id}", status_code=204)
def delete_screenshot(
    screenshot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete screenshot"""
    screenshot = (
        db.query(Screenshot)
        .filter(Screenshot.id == screenshot_id, Screenshot.user_id == current_user.id)
        .first()
    )
    
    if not screenshot:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    
    # Delete file
    storage_service = StorageService()
    storage_service.delete_file(screenshot.file_path)
    
    # Delete from database
    db.delete(screenshot)
    db.commit()
    
    return None


@router.post("/{screenshot_id}/favorite", response_model=ScreenshotResponse)
def toggle_favorite(
    screenshot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle favorite status"""
    screenshot = (
        db.query(Screenshot)
        .filter(Screenshot.id == screenshot_id, Screenshot.user_id == current_user.id)
        .first()
    )
    
    if not screenshot:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    
    screenshot.is_favorite = not screenshot.is_favorite
    db.commit()
    db.refresh(screenshot)
    
    return screenshot
