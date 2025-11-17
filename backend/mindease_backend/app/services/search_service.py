from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
import numpy as np
from app.models import Screenshot, Collection, Tag, AudioRecording
from app.services.ai_service import AIService
from app.config.settings import get_settings

settings = get_settings()


class SearchService:
    """Service for semantic and keyword-based search"""

    def __init__(self, db: Session):
        self.db = db
        self.ai_service = AIService()

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if not vec1 or not vec2:
            return 0.0

        vec1_np = np.array(vec1)
        vec2_np = np.array(vec2)

        dot_product = np.dot(vec1_np, vec2_np)
        norm1 = np.linalg.norm(vec1_np)
        norm2 = np.linalg.norm(vec2_np)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(dot_product / (norm1 * norm2))

    async def semantic_search(
        self,
        query: str,
        user_id: int,
        limit: int = 50,
        collection_id: Optional[int] = None,
        favorites_only: bool = False,
    ) -> List[Dict]:
        """
        Perform semantic search using embeddings

        Args:
            query: Search query
            user_id: User ID
            limit: Maximum results
            collection_id: Filter by collection
            favorites_only: Only search favorites
        """
        # Generate query embedding
        query_embedding = await self.ai_service.generate_embedding(query)

        if not query_embedding:
            # Fallback to keyword search
            return self.keyword_search(query, user_id, limit, collection_id, favorites_only)

        # Build base query
        query_builder = self.db.query(Screenshot).filter(Screenshot.user_id == user_id)

        if collection_id:
            query_builder = query_builder.join(Screenshot.collections).filter(
                Collection.id == collection_id
            )

        if favorites_only:
            query_builder = query_builder.filter(Screenshot.is_favorite == True)

        # Get all screenshots
        screenshots = query_builder.all()

        # Calculate similarity scores
        results = []
        for screenshot in screenshots:
            similarity_score = 0.0

            # Compare with text embedding
            if screenshot.text_embedding:
                text_sim = self.cosine_similarity(query_embedding, screenshot.text_embedding)
                similarity_score = max(similarity_score, text_sim)

            # Compare with image embedding
            if screenshot.image_embedding:
                image_sim = self.cosine_similarity(query_embedding, screenshot.image_embedding)
                similarity_score = max(similarity_score, image_sim * 0.8)  # Weight image less

            # Include if above threshold
            if similarity_score >= settings.SIMILARITY_THRESHOLD:
                results.append({
                    "screenshot": screenshot,
                    "similarity_score": similarity_score,
                    "match_type": "semantic",
                })

        # Sort by similarity score
        results.sort(key=lambda x: x["similarity_score"], reverse=True)

        return results[:limit]

    def keyword_search(
        self,
        query: str,
        user_id: int,
        limit: int = 50,
        collection_id: Optional[int] = None,
        favorites_only: bool = False,
    ) -> List[Dict]:
        """
        Perform keyword-based search

        Args:
            query: Search query
            user_id: User ID
            limit: Maximum results
            collection_id: Filter by collection
            favorites_only: Only search favorites
        """
        # Build search query
        query_builder = self.db.query(Screenshot).filter(Screenshot.user_id == user_id)

        # Apply filters
        if collection_id:
            query_builder = query_builder.join(Screenshot.collections).filter(
                Collection.id == collection_id
            )

        if favorites_only:
            query_builder = query_builder.filter(Screenshot.is_favorite == True)

        # Search in multiple fields
        search_terms = query.lower().split()
        conditions = []

        for term in search_terms:
            term_conditions = [
                Screenshot.ocr_text.ilike(f"%{term}%"),
                Screenshot.ai_description.ilike(f"%{term}%"),
                Screenshot.file_name.ilike(f"%{term}%"),
                Screenshot.ai_tags.any(term),
            ]
            conditions.append(or_(*term_conditions))

        if conditions:
            query_builder = query_builder.filter(and_(*conditions))

        # Execute query
        screenshots = query_builder.limit(limit).all()

        # Calculate relevance scores
        results = []
        for screenshot in screenshots:
            relevance_score = self._calculate_keyword_relevance(query, screenshot)
            results.append({
                "screenshot": screenshot,
                "similarity_score": relevance_score,
                "match_type": "keyword",
            })

        # Sort by relevance
        results.sort(key=lambda x: x["similarity_score"], reverse=True)

        return results

    def _calculate_keyword_relevance(self, query: str, screenshot: Screenshot) -> float:
        """Calculate relevance score for keyword search"""
        score = 0.0
        query_lower = query.lower()
        search_terms = query_lower.split()

        # Check OCR text
        if screenshot.ocr_text:
            text_lower = screenshot.ocr_text.lower()
            for term in search_terms:
                if term in text_lower:
                    score += 0.3

        # Check AI description
        if screenshot.ai_description:
            desc_lower = screenshot.ai_description.lower()
            for term in search_terms:
                if term in desc_lower:
                    score += 0.2

        # Check tags
        if screenshot.ai_tags:
            for tag in screenshot.ai_tags:
                if any(term in tag.lower() for term in search_terms):
                    score += 0.4

        # Check filename
        if screenshot.file_name:
            filename_lower = screenshot.file_name.lower()
            for term in search_terms:
                if term in filename_lower:
                    score += 0.1

        return min(score, 1.0)

    def search_by_tag(self, tag_name: str, user_id: int, limit: int = 50) -> List[Screenshot]:
        """Search screenshots by tag"""
        return (
            self.db.query(Screenshot)
            .join(Screenshot.tags)
            .filter(Screenshot.user_id == user_id, Tag.name == tag_name)
            .limit(limit)
            .all()
        )

    def search_by_date_range(
        self, user_id: int, start_date, end_date, limit: int = 50
    ) -> List[Screenshot]:
        """Search screenshots by date range"""
        return (
            self.db.query(Screenshot)
            .filter(
                Screenshot.user_id == user_id,
                Screenshot.captured_at >= start_date,
                Screenshot.captured_at <= end_date,
            )
            .order_by(Screenshot.captured_at.desc())
            .limit(limit)
            .all()
        )

    def get_related_screenshots(
        self, screenshot_id: int, user_id: int, limit: int = 10
    ) -> List[Dict]:
        """Find screenshots related to the given screenshot"""
        # Get the source screenshot
        screenshot = (
            self.db.query(Screenshot)
            .filter(Screenshot.id == screenshot_id, Screenshot.user_id == user_id)
            .first()
        )

        if not screenshot or not screenshot.text_embedding:
            return []

        # Find similar screenshots
        all_screenshots = (
            self.db.query(Screenshot)
            .filter(
                Screenshot.user_id == user_id,
                Screenshot.id != screenshot_id,
                Screenshot.text_embedding.isnot(None),
            )
            .all()
        )

        results = []
        for other_screenshot in all_screenshots:
            if other_screenshot.text_embedding:
                similarity = self.cosine_similarity(
                    screenshot.text_embedding, other_screenshot.text_embedding
                )
                if similarity >= settings.SIMILARITY_THRESHOLD:
                    results.append({
                        "screenshot": other_screenshot,
                        "similarity_score": similarity,
                    })

        # Sort by similarity
        results.sort(key=lambda x: x["similarity_score"], reverse=True)

        return results[:limit]

    async def search_audio(self, query: str, user_id: int, limit: int = 20) -> List[Dict]:
        """Search audio recordings by transcription"""
        # Generate query embedding
        query_embedding = await self.ai_service.generate_embedding(query)

        # Get all audio recordings
        recordings = (
            self.db.query(AudioRecording)
            .filter(AudioRecording.user_id == user_id, AudioRecording.transcription.isnot(None))
            .all()
        )

        results = []
        for recording in recordings:
            # Calculate similarity
            similarity_score = 0.0

            if recording.transcription_embedding and query_embedding:
                similarity_score = self.cosine_similarity(
                    query_embedding, recording.transcription_embedding
                )

            # Keyword match in transcription
            if query.lower() in (recording.transcription or "").lower():
                similarity_score = max(similarity_score, 0.8)

            if similarity_score >= settings.SIMILARITY_THRESHOLD:
                results.append({
                    "recording": recording,
                    "similarity_score": similarity_score,
                })

        # Sort by similarity
        results.sort(key=lambda x: x["similarity_score"], reverse=True)

        return results[:limit]
