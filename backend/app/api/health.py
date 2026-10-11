from fastapi import APIRouter
from backend.app.config import settings
from backend.app.schemas import HealthResponse
from backend.app.db.database import get_db_status
from backend.app.services.rag_service import rag_service
from backend.app.services.llm_service import llm_service

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health():
    db_status = get_db_status()
    chroma_status = rag_service.get_status()
    ollama_status = llm_service.check_ollama()

    is_overall_ok = (
        db_status.get("status") == "connected"
        and chroma_status.get("status") == "ready"
    )

    return HealthResponse(
        status="ok" if is_overall_ok else "degraded",
        app_version=settings.APP_VERSION,
        database=db_status,
        chromadb=chroma_status,
        ollama=ollama_status,
    )
