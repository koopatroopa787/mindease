from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.config.database import get_db
from app.models import Collection, Screenshot, ScreenshotCollection, User
from app.schemas import (
    CollectionCreate,
    CollectionUpdate,
    CollectionResponse,
    CollectionListResponse,
    AddScreenshotsRequest,
)
from app.api.v1.endpoints.screenshots import get_current_user

router = APIRouter()


@router.post("/", response_model=CollectionResponse, status_code=201)
def create_collection(
    collection_data: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new collection"""
    collection = Collection(
        user_id=current_user.id,
        name=collection_data.name,
        description=collection_data.description,
        color=collection_data.color,
        icon=collection_data.icon,
        is_smart=collection_data.is_smart,
        smart_rules=collection_data.smart_rules
    )
    
    db.add(collection)
    db.commit()
    db.refresh(collection)
    
    collection.screenshot_count = 0
    return collection


@router.get("/", response_model=CollectionListResponse)
def get_collections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all collections"""
    collections = db.query(Collection).filter(Collection.user_id == current_user.id).all()
    
    # Add screenshot counts
    for collection in collections:
        collection.screenshot_count = len(collection.screenshots)
    
    return {
        "collections": collections,
        "total": len(collections)
    }


@router.get("/{collection_id}", response_model=CollectionResponse)
def get_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get collection by ID"""
    collection = (
        db.query(Collection)
        .filter(Collection.id == collection_id, Collection.user_id == current_user.id)
        .first()
    )
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    collection.screenshot_count = len(collection.screenshots)
    return collection


@router.patch("/{collection_id}", response_model=CollectionResponse)
def update_collection(
    collection_id: int,
    update_data: CollectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update collection"""
    collection = (
        db.query(Collection)
        .filter(Collection.id == collection_id, Collection.user_id == current_user.id)
        .first()
    )
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if update_data.name is not None:
        collection.name = update_data.name
    if update_data.description is not None:
        collection.description = update_data.description
    if update_data.color is not None:
        collection.color = update_data.color
    if update_data.icon is not None:
        collection.icon = update_data.icon
    
    db.commit()
    db.refresh(collection)
    
    collection.screenshot_count = len(collection.screenshots)
    return collection


@router.delete("/{collection_id}", status_code=204)
def delete_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete collection"""
    collection = (
        db.query(Collection)
        .filter(Collection.id == collection_id, Collection.user_id == current_user.id)
        .first()
    )
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    db.delete(collection)
    db.commit()
    
    return None


@router.post("/{collection_id}/screenshots")
def add_screenshots_to_collection(
    collection_id: int,
    request: AddScreenshotsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add screenshots to collection"""
    collection = (
        db.query(Collection)
        .filter(Collection.id == collection_id, Collection.user_id == current_user.id)
        .first()
    )
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    for screenshot_id in request.screenshot_ids:
        # Check if association already exists
        existing = (
            db.query(ScreenshotCollection)
            .filter(
                ScreenshotCollection.collection_id == collection_id,
                ScreenshotCollection.screenshot_id == screenshot_id
            )
            .first()
        )
        
        if not existing:
            association = ScreenshotCollection(
                collection_id=collection_id,
                screenshot_id=screenshot_id
            )
            db.add(association)
    
    db.commit()
    
    return {"message": "Screenshots added to collection"}


@router.delete("/{collection_id}/screenshots/{screenshot_id}")
def remove_screenshot_from_collection(
    collection_id: int,
    screenshot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove screenshot from collection"""
    association = (
        db.query(ScreenshotCollection)
        .filter(
            ScreenshotCollection.collection_id == collection_id,
            ScreenshotCollection.screenshot_id == screenshot_id
        )
        .first()
    )
    
    if not association:
        raise HTTPException(status_code=404, detail="Screenshot not in collection")
    
    db.delete(association)
    db.commit()
    
    return {"message": "Screenshot removed from collection"}
