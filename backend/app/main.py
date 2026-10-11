import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.db.database import Base, engine, get_db_status
from backend.app.services.rag_service import rag_service
from backend.app.services.llm_service import llm_service
from backend.app.api.health import router as health_router
from backend.app.api.chat import router as chat_router
from backend.app.api.conversations import router as conversations_router
from backend.app.api.essays import router as essays_router
from backend.app.api.insights import router as insights_router
from backend.app.api.models import router as models_router
from backend.app.api.discover import router as discover_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("lenny_growth_assistant")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing Lenny Growth Assistant Backend...")
    try:
        # Create database tables if they do not exist
        Base.metadata.create_all(bind=engine)
        db_stat = get_db_status()
        logger.info(f"Database initialized: {db_stat}")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")

    try:
        chroma_stat = rag_service.get_status()
        logger.info(f"ChromaDB status: {chroma_stat}")
    except Exception as e:
        logger.warning(f"ChromaDB connection check warning: {e}")

    try:
        ollama_stat = llm_service.check_ollama()
        logger.info(f"Ollama status: {ollama_stat}")
    except Exception as e:
        logger.warning(f"Ollama connection check warning: {e}")

    yield

    # Shutdown sequence
    logger.info("Shutting down Lenny Growth Assistant Backend...")


app = FastAPI(
    title="Lenny Growth Assistant API",
    description="Backend API powering the Lenny's Podcast AI Research Assistant and Editorial Studio.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(conversations_router, prefix="/api")
app.include_router(essays_router, prefix="/api")
app.include_router(insights_router, prefix="/api")
app.include_router(models_router, prefix="/api")
app.include_router(discover_router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "Lenny Growth Assistant API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/health",
    }
