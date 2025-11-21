from sqlalchemy.orm import Session
from app.models import Collection, Screenshot, ScreenshotCollection
from typing import List, Dict


class CollectionService:
    """Service for auto-creating and managing collections"""

    def __init__(self, db: Session):
        self.db = db

    def auto_create_collections_from_tags(self, screenshot: Screenshot) -> List[Collection]:
        """
        Automatically create or add screenshot to collections based on AI tags

        Args:
            screenshot: Screenshot object with ai_tags

        Returns:
            List of collections the screenshot was added to
        """
        if not screenshot.ai_tags or len(screenshot.ai_tags) == 0:
            return []

        collections_added = []

        # Define common tag groups that should create collections
        tag_to_collection_mapping = {
            'work': ['work', 'business', 'office', 'professional'],
            'code': ['code', 'programming', 'development', 'software', 'github'],
            'design': ['design', 'ui', 'ux', 'mockup', 'wireframe'],
            'meeting': ['meeting', 'zoom', 'teams', 'conference'],
            'document': ['document', 'pdf', 'text', 'file'],
            'chat': ['chat', 'message', 'conversation', 'slack', 'discord'],
            'social': ['social', 'twitter', 'facebook', 'instagram', 'linkedin'],
            'education': ['education', 'learning', 'tutorial', 'course'],
            'finance': ['finance', 'money', 'payment', 'invoice', 'receipt'],
            'travel': ['travel', 'flight', 'hotel', 'booking'],
        }

        # Check each tag against our mapping
        for collection_name, keywords in tag_to_collection_mapping.items():
            for tag in screenshot.ai_tags:
                tag_lower = tag.lower()
                if any(keyword in tag_lower for keyword in keywords):
                    # Find or create collection
                    collection = self._get_or_create_collection(
                        user_id=screenshot.user_id,
                        name=collection_name.title(),
                        description=f"Auto-created collection for {collection_name}-related screenshots",
                        is_smart=True
                    )

                    # Add screenshot to collection if not already there
                    if not self._screenshot_in_collection(screenshot.id, collection.id):
                        self._add_screenshot_to_collection(screenshot.id, collection.id)
                        collections_added.append(collection)

                    break  # Only match once per collection

        return collections_added

    def _get_or_create_collection(
        self,
        user_id: int,
        name: str,
        description: str = None,
        is_smart: bool = False
    ) -> Collection:
        """Get existing collection or create new one"""
        collection = (
            self.db.query(Collection)
            .filter(Collection.user_id == user_id, Collection.name == name)
            .first()
        )

        if not collection:
            collection = Collection(
                user_id=user_id,
                name=name,
                description=description,
                is_smart=is_smart
            )
            self.db.add(collection)
            self.db.commit()
            self.db.refresh(collection)

        return collection

    def _screenshot_in_collection(self, screenshot_id: int, collection_id: int) -> bool:
        """Check if screenshot is already in collection"""
        exists = (
            self.db.query(ScreenshotCollection)
            .filter(
                ScreenshotCollection.screenshot_id == screenshot_id,
                ScreenshotCollection.collection_id == collection_id
            )
            .first()
        )
        return exists is not None

    def _add_screenshot_to_collection(self, screenshot_id: int, collection_id: int):
        """Add screenshot to collection"""
        association = ScreenshotCollection(
            screenshot_id=screenshot_id,
            collection_id=collection_id
        )
        self.db.add(association)
        self.db.commit()

    def suggest_collections_for_screenshot(self, screenshot: Screenshot) -> List[str]:
        """Suggest collection names based on screenshot content"""
        suggestions = []

        if not screenshot.ai_tags:
            return suggestions

        # Analyze tags to suggest collections
        tags_lower = [tag.lower() for tag in screenshot.ai_tags]

        if any(word in ' '.join(tags_lower) for word in ['work', 'business', 'office']):
            suggestions.append('Work')
        if any(word in ' '.join(tags_lower) for word in ['code', 'programming', 'development']):
            suggestions.append('Code')
        if any(word in ' '.join(tags_lower) for word in ['design', 'ui', 'ux']):
            suggestions.append('Design')
        if any(word in ' '.join(tags_lower) for word in ['meeting', 'zoom', 'call']):
            suggestions.append('Meetings')

        return suggestions
