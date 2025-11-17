import os
import uuid
import shutil
from pathlib import Path
from typing import BinaryIO, Optional
from datetime import datetime
from app.config.settings import get_settings

settings = get_settings()


class StorageService:
    """Service for handling file storage operations"""

    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self._ensure_directories()

    def _ensure_directories(self):
        """Create upload directories if they don't exist"""
        directories = [
            self.upload_dir,
            self.upload_dir / "screenshots",
            self.upload_dir / "audio",
            self.upload_dir / "thumbnails",
        ]
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

    def _generate_filename(self, original_filename: str, prefix: str = "") -> str:
        """Generate a unique filename"""
        file_extension = Path(original_filename).suffix
        unique_id = uuid.uuid4().hex
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{prefix}{timestamp}_{unique_id}{file_extension}"

    def save_screenshot(self, file: BinaryIO, original_filename: str) -> tuple[str, str]:
        """
        Save a screenshot file
        Returns: (file_path, file_name)
        """
        filename = self._generate_filename(original_filename, "screenshot_")
        file_path = self.upload_dir / "screenshots" / filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file, buffer)

        return str(file_path), filename

    def save_audio(self, file: BinaryIO, original_filename: str) -> tuple[str, str]:
        """
        Save an audio file
        Returns: (file_path, file_name)
        """
        filename = self._generate_filename(original_filename, "audio_")
        file_path = self.upload_dir / "audio" / filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file, buffer)

        return str(file_path), filename

    def save_thumbnail(self, file: BinaryIO, original_filename: str) -> tuple[str, str]:
        """
        Save a thumbnail image
        Returns: (file_path, file_name)
        """
        filename = self._generate_filename(original_filename, "thumb_")
        file_path = self.upload_dir / "thumbnails" / filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file, buffer)

        return str(file_path), filename

    def delete_file(self, file_path: str) -> bool:
        """Delete a file from storage"""
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False

    def get_file_size(self, file_path: str) -> Optional[int]:
        """Get file size in bytes"""
        try:
            return Path(file_path).stat().st_size
        except Exception:
            return None

    def file_exists(self, file_path: str) -> bool:
        """Check if a file exists"""
        return Path(file_path).exists()

    def get_storage_stats(self) -> dict:
        """Get storage statistics"""
        screenshot_dir = self.upload_dir / "screenshots"
        audio_dir = self.upload_dir / "audio"
        thumbnail_dir = self.upload_dir / "thumbnails"

        def get_dir_size(directory: Path) -> int:
            """Calculate total size of directory"""
            return sum(f.stat().st_size for f in directory.rglob("*") if f.is_file())

        return {
            "screenshots": {
                "count": len(list(screenshot_dir.glob("*"))),
                "size_bytes": get_dir_size(screenshot_dir),
            },
            "audio": {
                "count": len(list(audio_dir.glob("*"))),
                "size_bytes": get_dir_size(audio_dir),
            },
            "thumbnails": {
                "count": len(list(thumbnail_dir.glob("*"))),
                "size_bytes": get_dir_size(thumbnail_dir),
            },
        }
