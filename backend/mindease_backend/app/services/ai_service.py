import base64
import json
from typing import Optional, Dict, List
from pathlib import Path
import asyncio
from app.config.settings import get_settings

settings = get_settings()


class AIService:
    """Service for AI-powered screenshot analysis using vision models"""

    def __init__(self):
        self.settings = settings
        self.provider = settings.USE_AI_PROVIDER

    def _encode_image(self, image_path: str) -> str:
        """Encode image to base64"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    async def analyze_screenshot_openai(self, image_path: str, ocr_text: Optional[str] = None) -> Dict:
        """Analyze screenshot using OpenAI's vision model"""
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            base64_image = self._encode_image(image_path)

            prompt = """Analyze this screenshot and provide:
1. A detailed description of what you see
2. The type of content (e.g., website, document, chat, code, email, social media)
3. The main purpose or context
4. Relevant tags (5-10 keywords)
5. Any detected entities (people, companies, places)
6. The sentiment (positive, negative, neutral)
7. Key information that might be useful for searching

If OCR text is provided, use it to enhance your analysis."""

            if ocr_text:
                prompt += f"\n\nOCR Text extracted:\n{ocr_text[:1000]}"

            response = await client.chat.completions.create(
                model=settings.VISION_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=1000,
            )

            content = response.choices[0].message.content
            return self._parse_analysis_response(content)

        except Exception as e:
            print(f"Error in OpenAI analysis: {e}")
            return self._get_empty_analysis()

    async def analyze_screenshot_anthropic(self, image_path: str, ocr_text: Optional[str] = None) -> Dict:
        """Analyze screenshot using Anthropic's vision model"""
        try:
            from anthropic import AsyncAnthropic

            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

            base64_image = self._encode_image(image_path)

            # Detect image type
            image_type = Path(image_path).suffix.lower()
            media_type = {
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".gif": "image/gif",
                ".webp": "image/webp",
            }.get(image_type, "image/jpeg")

            prompt = """Analyze this screenshot and provide a JSON response with:
{
  "description": "detailed description",
  "content_type": "type of content",
  "scene_type": "scene classification",
  "tags": ["tag1", "tag2", ...],
  "entities": {"people": [], "organizations": [], "places": []},
  "sentiment": "positive/negative/neutral",
  "sentiment_score": 0.0-1.0,
  "key_information": "searchable information"
}"""

            if ocr_text:
                prompt += f"\n\nOCR Text: {ocr_text[:1000]}"

            response = await client.messages.create(
                model=settings.VISION_MODEL,
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": base64_image,
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
            )

            content = response.content[0].text
            return self._parse_analysis_response(content)

        except Exception as e:
            print(f"Error in Anthropic analysis: {e}")
            return self._get_empty_analysis()

    def _parse_analysis_response(self, response: str) -> Dict:
        """Parse AI response into structured format"""
        try:
            # Try to extract JSON if present
            if "{" in response and "}" in response:
                start = response.index("{")
                end = response.rindex("}") + 1
                json_str = response[start:end]
                return json.loads(json_str)
        except Exception:
            pass

        # Fallback: parse text response
        return {
            "description": response[:500],
            "content_type": "unknown",
            "scene_type": "general",
            "tags": self._extract_keywords(response),
            "entities": {"people": [], "organizations": [], "places": []},
            "sentiment": "neutral",
            "sentiment_score": 0.5,
            "key_information": response[:200],
        }

    def _extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract keywords from text"""
        # Simple keyword extraction - can be improved with NLP
        words = text.lower().split()
        # Filter common words
        stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"}
        keywords = [w for w in words if len(w) > 3 and w not in stop_words]
        return list(set(keywords))[:max_keywords]

    def _get_empty_analysis(self) -> Dict:
        """Return empty analysis structure"""
        return {
            "description": "",
            "content_type": "unknown",
            "scene_type": "unknown",
            "tags": [],
            "entities": {"people": [], "organizations": [], "places": []},
            "sentiment": "neutral",
            "sentiment_score": 0.5,
            "key_information": "",
        }

    async def analyze_screenshot(self, image_path: str, ocr_text: Optional[str] = None) -> Dict:
        """Main method to analyze screenshot using configured provider"""
        if self.provider == "openai":
            return await self.analyze_screenshot_openai(image_path, ocr_text)
        elif self.provider == "anthropic":
            return await self.analyze_screenshot_anthropic(image_path, ocr_text)
        else:
            return self._get_empty_analysis()

    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text"""
        if not text:
            return []

        try:
            if self.provider == "openai":
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

                response = await client.embeddings.create(
                    model=settings.EMBEDDING_MODEL,
                    input=text[:8000]  # Limit text length
                )
                return response.data[0].embedding
            else:
                # Anthropic doesn't have embedding API yet, use OpenAI as fallback
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

                response = await client.embeddings.create(
                    model="text-embedding-3-small",
                    input=text[:8000]
                )
                return response.data[0].embedding

        except Exception as e:
            print(f"Error generating embedding: {e}")
            return []

    async def transcribe_audio(self, audio_path: str) -> str:
        """Transcribe audio file to text"""
        try:
            if self.provider == "openai":
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

                with open(audio_path, "rb") as audio_file:
                    response = await client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file
                    )
                return response.text
            else:
                # Fallback or use alternative service
                return ""
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return ""

    async def summarize_text(self, text: str) -> str:
        """Generate summary of text"""
        try:
            if self.provider == "openai":
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

                response = await client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "Summarize the following text in 2-3 sentences."},
                        {"role": "user", "content": text[:2000]}
                    ],
                    max_tokens=150
                )
                return response.choices[0].message.content
            elif self.provider == "anthropic":
                from anthropic import AsyncAnthropic
                client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

                response = await client.messages.create(
                    model="claude-3-5-haiku-20241022",
                    max_tokens=150,
                    messages=[
                        {
                            "role": "user",
                            "content": f"Summarize this in 2-3 sentences:\n\n{text[:2000]}"
                        }
                    ]
                )
                return response.content[0].text
        except Exception as e:
            print(f"Error summarizing text: {e}")
            return text[:200]
