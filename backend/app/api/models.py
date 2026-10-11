from fastapi import APIRouter
from backend.app.schemas import ModelListResponse, ModelInfo
from backend.app.services.llm_service import llm_service
from backend.app.config import settings

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("", response_model=ModelListResponse)
def get_models():
    models_data = llm_service.get_models()
    return ModelListResponse(
        models=[ModelInfo(**m) for m in models_data],
        default_provider=settings.DEFAULT_LLM_PROVIDER,
    )
