# Lenny Growth Assistant

**An AI-powered product growth, product management, and leadership research assistant grounded in Lenny's Podcast transcripts.**

Designed with an original, premium editorial aesthetic ("The Product Research Desk"), Lenny Growth Assistant empowers founders, product leaders, and growth practitioners to query over 300+ in-depth podcast interviews with actual verbatim citations, explore curated topic libraries, save key frameworks, and draft 1,250-word editorial essays.

---

## 🏛 System Architecture

```
┌────────────────────────────────────────────────────────┐
│             React Frontend (Port 3000)                 │
│  - Editorial Intelligence UI (CSS Variables & Tokens)  │
│  - Conversational RAG with Inline Citations [S1], [S2] │
│  - Collapsible Evidence Panel (The Evidence)           │
│  - Curated Discover Desk & Saved Insights              │
│  - Essay Studio (30 for 30 Style Long-Form Essays)     │
│  - Sandboxed DOMPurify Artifact Viewer                 │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP API Calls (/api)
                            ▼
┌────────────────────────────────────────────────────────┐
│             FastAPI Backend (Port 8000)                │
│  - FastAPI REST Endpoints                              │
│  - Pydantic v2 Request & Response Validation           │
│  - PostgreSQL Persistence via SQLAlchemy 2.x & Alembic │
│    (With explicit labeled local SQLite dev fallback)   │
│  - Grounded RAG Pipeline & Citation Normalization      │
│  - Model Provider Abstraction (Ollama / Cloud)         │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│     ChromaDB Vector Store    │ │       Ollama Local LLM       │
│  - Collection: lenny_podcast │ │  - nomic-embed-text          │
│  - 32,325 transcript chunks  │ │    (Query Embeddings)        │
│  - 303 podcast episodes      │ │  - llama3.2                  │
│  - Cosine Distance Metric    │ │    (Grounded Synthesis)      │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## ✨ Key Features

1. **Editorial Research Desk**:
   - Distinctive typographical design using *Newsreader*, *Instrument Serif*, *DM Sans*, and *IBM Plex Mono*.
   - Thoughtful color palette (`#F7F6F2`, `#20211D`, `#52634A` moss olive, `#C76D4A` terracotta).
   - Zero generic AI chatbot bubbles or unnecessary glowing gradients.
2. **Grounded Conversational RAG**:
   - Reuses the existing indexed ChromaDB collection (`lenny_podcast`, 32,325 chunks).
   - Generates embeddings with Ollama's `nomic-embed-text`.
   - Generates answers with Ollama's `llama3.2` using strict anti-hallucination system prompts.
   - Automatically handles unsupported queries by admitting lack of evidence.
3. **Interactive Evidence Explorer ("THE EVIDENCE")**:
   - Every claim is cited with inline chips like `[S1]`, `[S2]`.
   - Clicking a citation opens the right-hand evidence drawer, scrolls to the matching quote, and highlights it.
   - Shows real episode titles, guest names, verbatim excerpts, YouTube links, and similarity scores.
4. **Discover Page ("Ideas Worth Exploring")**:
   - Curated product topics: Growth Loops, Retention, Product Strategy, PM Excellence, Product-Market Fit, and Hiring.
   - Live transcript exploration directly on the topic desk.
5. **Saved Insights Repository**:
   - One-click saving of assistant answers and evidence into PostgreSQL.
6. **Essay Studio (~1,250-word Deep Dives)**:
   - Dedicated long-form writing desk following Lenny's *30 for 30*-style editorial essays.
   - Grounded in retrieved transcript chunks, with thesis formulation and word-counter badges.
7. **Secure Artifact Viewer**:
   - View generated essays in either styled reading mode or raw markdown.
   - Sandboxed `<iframe>` rendering with `DOMPurify` HTML sanitization to prevent script execution.
8. **Configurable Providers & PostgreSQL Persistence**:
   - Default: Local Ollama (private and free).
   - Optional Cloud: OpenAI and Anthropic Claude via backend environment variables.
   - Full persistence of conversations, messages, insights, and essays in PostgreSQL (with SQLite development fallback when PostgreSQL is not configured).

---

## 🚀 Quickstart Guide

### Option A: Complete Full-Stack with Docker Compose (Recommended)

Run the entire application—React frontend, FastAPI backend, and PostgreSQL database—with a single command:

```bash
docker compose up --build
```

Or run in the background (detached mode):

```bash
docker compose up --build -d
```

#### Verification & Health Checks
- **Frontend**: Open [http://localhost:3000](http://localhost:3000) in your browser.
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
  - Reports status for PostgreSQL, ChromaDB, and Ollama.
  - Confirms `"is_postgresql": true` and `"is_dev_fallback": false`.

#### View Logs
```bash
# View logs from all services
docker compose logs -f

# View logs from a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

#### Shutdown Commands
```bash
# Graceful shutdown (preserves database data)
docker compose down

# Shutdown and remove persistent database volumes (clean reset)
docker compose down -v
```

---

### Option B: Local Development (Without Docker Compose)

#### Prerequisites
- **Python 3.9+**
- **Node.js 18+ and npm**
- **Ollama** running locally (`ollama run llama3.2` and `ollama pull nomic-embed-text`)
- **ChromaDB**: Existing `chroma_db/` directory containing the `lenny_podcast` collection.

---

### 1. Backend Setup

```bash
cd ~/lenny-growth-assistant

# Activate the virtual environment
source .venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt

# (Optional) Copy environment configuration
cp .env.example .env

# Start FastAPI server
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

The FastAPI backend will start at `http://127.0.0.1:8000`.
- Interactive Swagger API docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

---

### 2. Frontend Setup

In a separate terminal:

```bash
cd ~/lenny-growth-assistant/frontend

# Install dependencies
npm install

# Start development server
npm start
```

The React frontend will open at `http://localhost:3000`.

---

## 🗄 Database Configuration (PostgreSQL & Fallback)

### Production PostgreSQL Setup
To run PostgreSQL locally via Docker Compose:

```bash
docker compose up -d postgres
```

Then configure `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lenny_assistant
```

Apply migrations:
```bash
alembic upgrade head
```

### Development SQLite Fallback
If `DATABASE_URL` is omitted or PostgreSQL is unreachable, the application automatically uses a local SQLite database (`sqlite:///./lenny_growth_assistant.db`) and explicitly reports `is_dev_fallback: true` in the health status endpoint.

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Comprehensive health check (Database, ChromaDB 32K chunks, Ollama) |
| `GET` | `/api/models` | List available and configured LLM providers & models |
| `POST` | `/api/chat` | Send research inquiry, retrieve ChromaDB chunks, return grounded answer |
| `GET` | `/api/conversations` | List saved conversations grouped by update timestamp |
| `GET` | `/api/conversations/{id}` | Retrieve full conversation with message history |
| `PATCH`| `/api/conversations/{id}` | Rename conversation title |
| `DELETE`| `/api/conversations/{id}`| Delete conversation and cascading messages |
| `GET` | `/api/conversations/{id}/messages` | Retrieve messages for a specific conversation |
| `GET` | `/api/saved-insights` | List bookmarked product insights |
| `POST`| `/api/saved-insights` | Save a new insight with sources and topic tag |
| `DELETE`| `/api/saved-insights/{id}` | Delete a saved insight |
| `POST`| `/api/essays` | Generate ~1,250-word editorial essay grounded in transcripts |
| `GET` | `/api/essays/{id}` | Retrieve essay details and markdown |
| `GET` | `/api/artifacts/{id}` | Retrieve HTML/Markdown artifact with sanitization metadata |
| `GET` | `/api/discover/topics` | Get curated product topics |
| `GET` | `/api/discover/topic-sources` | Retrieve live transcript citations for a topic |

---

## 🧪 Running Tests

### Backend Tests (Pytest)
Run unit and integration tests with pytest:

```bash
source .venv/bin/activate
pytest backend/tests/
```
All 10 tests validate:
- Health endpoint
- Model provider configuration
- Chat validation (empty/missing messages)
- Conversation CRUD & persistence
- Saved insights flow
- Discover topics endpoint
- Mocked RAG retrieval & citations `[S1]`
- Unsupported model provider error handling
- Essay generation and artifact retrieval

### Frontend Build Validation
```bash
cd frontend
npm run build
```
Builds cleanly with zero warnings (`Compiled successfully`).

---

## 📁 Repository Directory Structure

```
lenny-growth-assistant/
├── backend/
│   ├── alembic/                 # Database migrations (Alembic)
│   ├── app/
│   │   ├── api/                 # FastAPI router endpoints
│   │   │   ├── chat.py
│   │   │   ├── conversations.py
│   │   │   ├── discover.py
│   │   │   ├── essays.py
│   │   │   ├── health.py
│   │   │   ├── insights.py
│   │   │   └── models.py
│   │   ├── db/                  # SQLAlchemy 2.x models & session
│   │   │   ├── database.py
│   │   │   └── models.py
│   │   ├── services/            # Core business logic & RAG pipeline
│   │   │   ├── conversation_service.py
│   │   │   ├── essay_service.py
│   │   │   ├── llm_service.py
│   │   │   └── rag_service.py
│   │   ├── config.py            # Pydantic v2 application settings
│   │   ├── main.py              # FastAPI application entrypoint
│   │   └── schemas.py           # Pydantic request/response schemas
│   ├── tests/
│   │   └── test_backend.py      # Pytest test suite (10 tests)
│   ├── .env.example
│   ├── Dockerfile               # Backend Dockerfile (Python 3.11 slim)
│   └── requirements.txt
├── chroma_db/                   # Existing indexed vector database (32,325 chunks)
├── docker-compose.yml           # Full-Stack Docker Compose (Postgres, Backend, Frontend)
├── .dockerignore
├── frontend/
│   ├── public/
│   │   └── index.html           # Editorial fonts (Newsreader, Instrument Serif, DM Sans)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Application views
│   │   ├── services/
│   │   │   └── api.js           # Frontend API client
│   │   ├── styles/
│   │   │   ├── components.css
│   │   │   ├── global.css
│   │   │   └── tokens.css
│   │   ├── App.js
│   │   └── index.js
│   ├── .env.example
│   ├── Dockerfile               # Frontend multi-stage Dockerfile (Node 20 + Nginx)
│   ├── nginx.conf               # Nginx reverse proxy configuration
│   └── package.json
├── ingest.py                    # Original transcript ingestion script (intact)
├── query.py                     # Original RAG CLI query script (intact)
├── pytest.ini
└── README.md
```
