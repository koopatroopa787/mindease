from typing import Optional, Dict, List
from pathlib import Path
from PIL import Image
import io
from app.config.settings import get_settings

settings = get_settings()


class OCRService:
    """Service for extracting text from images using OCR"""

    def __init__(self):
        self.settings = settings
        self.use_tesseract = True
        self.use_easyocr = False

    def extract_text_tesseract(self, image_path: str) -> Dict[str, any]:
        """Extract text using Tesseract OCR"""
        try:
            import pytesseract
            from PIL import Image

            # Configure tesseract path if specified
            if settings.TESSERACT_CMD:
                pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

            # Open and process image
            image = Image.open(image_path)

            # Get text with confidence scores
            data = pytesseract.image_to_data(image, lang=settings.OCR_LANGUAGES, output_type=pytesseract.Output.DICT)

            # Extract text
            text = pytesseract.image_to_string(image, lang=settings.OCR_LANGUAGES)

            # Get bounding boxes for text regions
            text_regions = []
            n_boxes = len(data["text"])
            for i in range(n_boxes):
                if int(data["conf"][i]) > 0:  # Only include confident detections
                    text_regions.append({
                        "text": data["text"][i],
                        "confidence": float(data["conf"][i]) / 100,
                        "bbox": {
                            "x": data["left"][i],
                            "y": data["top"][i],
                            "width": data["width"][i],
                            "height": data["height"][i],
                        },
                    })

            return {
                "text": text.strip(),
                "text_regions": text_regions,
                "method": "tesseract",
            }

        except Exception as e:
            print(f"Error in Tesseract OCR: {e}")
            return {"text": "", "text_regions": [], "method": "tesseract"}

    def extract_text_easyocr(self, image_path: str) -> Dict[str, any]:
        """Extract text using EasyOCR (more accurate for complex layouts)"""
        try:
            import easyocr

            # Initialize reader (cached after first use)
            if not hasattr(self, "_easyocr_reader"):
                self._easyocr_reader = easyocr.Reader(["en"])  # Can add more languages

            # Read image
            results = self._easyocr_reader.readtext(image_path)

            # Parse results
            text_parts = []
            text_regions = []

            for bbox, text, confidence in results:
                text_parts.append(text)
                text_regions.append({
                    "text": text,
                    "confidence": float(confidence),
                    "bbox": {
                        "points": bbox,  # Four corner points
                    },
                })

            return {
                "text": " ".join(text_parts),
                "text_regions": text_regions,
                "method": "easyocr",
            }

        except Exception as e:
            print(f"Error in EasyOCR: {e}")
            return {"text": "", "text_regions": [], "method": "easyocr"}

    def extract_text(self, image_path: str, method: Optional[str] = None) -> Dict[str, any]:
        """
        Extract text from image using specified or default method

        Args:
            image_path: Path to image file
            method: "tesseract", "easyocr", or None (auto-select)

        Returns:
            Dictionary with extracted text and metadata
        """
        if method == "tesseract" or (method is None and self.use_tesseract):
            return self.extract_text_tesseract(image_path)
        elif method == "easyocr" or (method is None and self.use_easyocr):
            return self.extract_text_easyocr(image_path)
        else:
            # Default to tesseract
            return self.extract_text_tesseract(image_path)

    def preprocess_image(self, image_path: str, output_path: str) -> str:
        """
        Preprocess image to improve OCR accuracy
        - Convert to grayscale
        - Increase contrast
        - Denoise
        """
        try:
            from PIL import Image, ImageEnhance, ImageFilter

            image = Image.open(image_path)

            # Convert to grayscale
            if image.mode != "L":
                image = image.convert("L")

            # Enhance contrast
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(2.0)

            # Denoise
            image = image.filter(ImageFilter.MedianFilter(size=3))

            # Save preprocessed image
            image.save(output_path)

            return output_path

        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return image_path

    def detect_text_regions(self, image_path: str) -> List[Dict]:
        """Detect regions of text in image"""
        try:
            import cv2
            import numpy as np

            # Read image
            image = cv2.imread(image_path)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Apply thresholding
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

            # Find contours
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            regions = []
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                # Filter small regions
                if w > 20 and h > 10:
                    regions.append({
                        "x": int(x),
                        "y": int(y),
                        "width": int(w),
                        "height": int(h),
                    })

            return regions

        except Exception as e:
            print(f"Error detecting text regions: {e}")
            return []

    def extract_structured_data(self, text: str) -> Dict:
        """Extract structured data from text (emails, URLs, phone numbers)"""
        import re

        # Email pattern
        email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
        emails = re.findall(email_pattern, text)

        # URL pattern
        url_pattern = r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+"
        urls = re.findall(url_pattern, text)

        # Phone number pattern (US format)
        phone_pattern = r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b"
        phones = re.findall(phone_pattern, text)

        # Date pattern (various formats)
        date_pattern = r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"
        dates = re.findall(date_pattern, text)

        return {
            "emails": list(set(emails)),
            "urls": list(set(urls)),
            "phone_numbers": list(set(phones)),
            "dates": list(set(dates)),
        }
