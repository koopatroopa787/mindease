from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models import User
from app.schemas import SearchRequest, SearchResponse, SearchResult
from app.services.search_service import SearchService
from app.api.v1.endpoints.screenshots import get_current_user

router = APIRouter()


@router.post("/", response_model=SearchResponse)
async def search_screenshots(
    search_request: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search screenshots using semantic or keyword search"""
    search_service = SearchService(db)
    
    results = []
    
    if search_request.search_type in ["semantic", "both"]:
        semantic_results = await search_service.semantic_search(
            query=search_request.query,
            user_id=current_user.id,
            limit=search_request.limit,
            collection_id=search_request.collection_id,
            favorites_only=search_request.favorites_only
        )
        results.extend(semantic_results)
    
    if search_request.search_type in ["keyword", "both"] and not results:
        keyword_results = search_service.keyword_search(
            query=search_request.query,
            user_id=current_user.id,
            limit=search_request.limit,
            collection_id=search_request.collection_id,
            favorites_only=search_request.favorites_only
        )
        results.extend(keyword_results)
    
    # Format results
    formatted_results = [
        SearchResult(
            screenshot=result["screenshot"],
            similarity_score=result["similarity_score"],
            match_type=result["match_type"],
            highlights=[]
        )
        for result in results
    ]
    
    return {
        "results": formatted_results,
        "total": len(formatted_results),
        "query": search_request.query,
        "search_type": search_request.search_type
    }


@router.get("/related/{screenshot_id}")
async def get_related_screenshots(
    screenshot_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get screenshots related to the given screenshot"""
    search_service = SearchService(db)
    
    results = await search_service.get_related_screenshots(
        screenshot_id=screenshot_id,
        user_id=current_user.id,
        limit=limit
    )
    
    return {
        "results": results,
        "total": len(results)
    }
