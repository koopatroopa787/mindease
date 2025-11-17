# MindEase - AI-Powered Screenshot & Content Management

MindEase is an intelligent application that helps you capture, organize, and search through screenshots and content using AI. It automatically analyzes images, extracts text, generates descriptions, and enables powerful semantic search across your content library.

## Features

### Core Functionality
- 📸 **Screenshot Management**: Upload and organize screenshots with automatic processing
- 🤖 **AI-Powered Analysis**: Automatic scene detection, object recognition, and content categorization using GPT-4 Vision or Claude
- 🔍 **Semantic Search**: Find screenshots using natural language queries, not just keywords
- 🎤 **Audio Recording**: Record up to 60-second voice memos attached to screenshots with automatic transcription
- 📁 **Smart Collections**: Organize content into collections with drag-and-drop functionality
- 🏷️ **Auto-Tagging**: AI-generated tags and metadata for easy organization
- ⭐ **Favorites**: Mark important screenshots for quick access
- 📊 **OCR Text Extraction**: Automatic text extraction from screenshots using Tesseract and EasyOCR

### AI Capabilities
- **Vision Analysis**: Detailed description of screenshot content, scene type detection, sentiment analysis
- **Entity Extraction**: Automatic detection of people, organizations, places, URLs, emails, phone numbers
- **Content Classification**: Auto-categorization (work, personal, entertainment, etc.)
- **Transcription**: Speech-to-text for audio recordings using Whisper
- **Summarization**: AI-generated summaries of transcriptions
- **Vector Embeddings**: Semantic search using text embeddings

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Primary database for structured data
- **Redis**: Caching and background task queue
- **SQLAlchemy**: ORM for database operations
- **Celery**: Async task processing (planned)

### AI & ML
- **OpenAI GPT-4 Vision**: Screenshot analysis
- **OpenAI Whisper**: Audio transcription
- **OpenAI Embeddings**: Semantic search
- **Anthropic Claude**: Alternative vision model
- **Tesseract OCR**: Text extraction
- **EasyOCR**: Advanced OCR capabilities
- **NumPy**: Vector operations

### Image Processing
- **Pillow**: Image manipulation
- **OpenCV**: Computer vision tasks

## Project Structure

```
mindease/
├── backend/
│   ├── mindease_backend/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── v1/
│   │   │   │       ├── endpoints/
│   │   │   │       │   ├── screenshots.py    # Screenshot management
│   │   │   │       │   ├── collections.py    # Collections API
│   │   │   │       │   ├── search.py         # Search functionality
│   │   │   │       │   └── analysis.py       # Audio recordings
│   │   │   │       └── api.py
│   │   │   ├── config/
│   │   │   │   ├── settings.py               # App configuration
│   │   │   │   └── database.py               # Database setup
│   │   │   ├── models/
│   │   │   │   ├── screenshots.py            # Screenshot model
│   │   │   │   ├── collection.py             # Collection model
│   │   │   │   ├── reminder.py               # Audio recording model
│   │   │   │   ├── analysis.py               # Analysis results model
│   │   │   │   └── user.py                   # User model
│   │   │   ├── schemas/
│   │   │   │   ├── screenshot.py             # Pydantic schemas
│   │   │   │   ├── collection.py
│   │   │   │   ├── search.py
│   │   │   │   └── audio.py
│   │   │   ├── services/
│   │   │   │   ├── ai_service.py             # AI/ML operations
│   │   │   │   ├── ocr_service.py            # Text extraction
│   │   │   │   ├── search_service.py         # Search logic
│   │   │   │   └── storage_service.py        # File management
│   │   │   └── main.py                       # FastAPI application
│   │   └── requirements/
│   │       └── base.txt
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- OpenAI API key or Anthropic API key
- Tesseract OCR (included in Docker image)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mindease
   ```

2. **Set up environment variables**
   ```bash
   cd backend
   cp .env.example .env
   ```

3. **Add your API keys to `.env`**
   ```
   OPENAI_API_KEY=your-key-here
   # or
   ANTHROPIC_API_KEY=your-key-here
   ```

4. **Start the services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database (port 5433)
   - Redis cache (port 6379)
   - FastAPI application (port 8000)

5. **Verify the installation**
   ```bash
   curl http://localhost:8000/health
   ```

### Local Development (Without Docker)

1. **Install dependencies**
   ```bash
   cd backend/mindease_backend
   pip install -r requirements/base.txt
   ```

2. **Start PostgreSQL and Redis**
   ```bash
   cd backend
   docker-compose up postgres redis -d
   ```

3. **Run the application**
   ```bash
   cd mindease_backend
   uvicorn app.main:app --reload
   ```

## API Documentation

Once the application is running, visit:
- **Interactive API docs (Swagger)**: http://localhost:8000/docs
- **Alternative API docs (ReDoc)**: http://localhost:8000/redoc

### Key API Endpoints

#### Screenshots
- `POST /api/v1/screenshots/upload` - Upload a screenshot
- `GET /api/v1/screenshots` - List all screenshots
- `GET /api/v1/screenshots/{id}` - Get screenshot details
- `PATCH /api/v1/screenshots/{id}` - Update screenshot
- `DELETE /api/v1/screenshots/{id}` - Delete screenshot
- `POST /api/v1/screenshots/{id}/favorite` - Toggle favorite status

#### Collections
- `POST /api/v1/collections` - Create collection
- `GET /api/v1/collections` - List collections
- `GET /api/v1/collections/{id}` - Get collection details
- `POST /api/v1/collections/{id}/screenshots` - Add screenshots to collection
- `DELETE /api/v1/collections/{id}/screenshots/{screenshot_id}` - Remove screenshot

#### Search
- `POST /api/v1/search` - Search screenshots (semantic or keyword)
- `GET /api/v1/search/related/{screenshot_id}` - Find related screenshots

#### Audio Recordings
- `POST /api/v1/audio/upload` - Upload audio recording
- `GET /api/v1/audio` - List audio recordings
- `GET /api/v1/audio/{id}` - Get audio recording details
- `DELETE /api/v1/audio/{id}` - Delete audio recording

## Usage Examples

### Upload a Screenshot

```bash
curl -X POST "http://localhost:8000/api/v1/screenshots/upload" \
  -F "file=@screenshot.png"
```

### Search for Screenshots

```bash
curl -X POST "http://localhost:8000/api/v1/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "meeting notes from last week",
    "search_type": "semantic",
    "limit": 10
  }'
```

### Upload Audio Recording

```bash
curl -X POST "http://localhost:8000/api/v1/audio/upload?screenshot_id=1" \
  -F "file=@recording.mp3"
```

### Create a Collection

```bash
curl -X POST "http://localhost:8000/api/v1/collections" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Work Documents",
    "description": "Important work-related screenshots",
    "color": "#3B82F6"
  }'
```

## Configuration

Key configuration options in `.env`:

- **AI Provider**: Choose between `openai` or `anthropic`
- **Vision Model**: `gpt-4o` or `claude-3-5-sonnet-20241022`
- **Embedding Model**: `text-embedding-3-small` (for semantic search)
- **OCR Languages**: Configure supported languages for Tesseract
- **Similarity Threshold**: Adjust semantic search sensitivity (0.0-1.0)

## How It Works

1. **Screenshot Upload**: User uploads a screenshot through the API
2. **Storage**: File is saved to local storage with a unique identifier
3. **Background Processing**:
   - OCR extracts text from the image
   - AI analyzes the screenshot (scene detection, description, tagging)
   - Vector embeddings are generated for semantic search
   - Metadata is extracted (URLs, emails, dates, etc.)
4. **Search**: Users can search using natural language; the system finds relevant screenshots using semantic similarity
5. **Audio Context**: Users can attach voice memos to screenshots, which are transcribed and made searchable

## Database Schema

- **users**: User accounts
- **screenshots**: Screenshot metadata and AI analysis
- **collections**: User-created collections
- **tags**: Content tags
- **audio_recordings**: Voice memos with transcriptions
- **analyses**: Detailed AI analysis results
- **screenshot_tags**: Many-to-many relationship
- **screenshot_collections**: Many-to-many relationship

## Roadmap

- [ ] Frontend web application (React/Vue)
- [ ] Mobile app (React Native)
- [ ] Real-time sync across devices
- [ ] Collaborative collections
- [ ] Browser extension for automatic screenshot capture
- [ ] Advanced filters and sorting
- [ ] Export functionality (PDF, Markdown)
- [ ] Integration with external LLMs (@MindSpace query format)
- [ ] Reminder system
- [ ] Activity timeline
- [ ] Analytics dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Add your license here]

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using FastAPI, PostgreSQL, and AI
