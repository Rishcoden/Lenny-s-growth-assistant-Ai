from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models import GeneratedEssay
from backend.app.schemas import EssayCreateRequest, EssayResponse, SourceItem
from backend.app.services.essay_service import essay_service

router = APIRouter(tags=["Essays & Artifacts"])


def _to_essay_response(essay: GeneratedEssay) -> EssayResponse:
    sources_list = [SourceItem(**s) for s in (essay.sources or [])]
    return EssayResponse(
        id=essay.id,
        title=essay.title,
        topic=essay.topic,
        central_question=essay.central_question,
        audience=essay.audience,
        tone=essay.tone,
        content_markdown=essay.content_markdown,
        content_html=essay.content_html,
        word_count=essay.word_count,
        sources=sources_list,
        created_at=essay.created_at,
        updated_at=essay.updated_at,
    )


@router.post("/essays", response_model=EssayResponse)
def create_essay(request: EssayCreateRequest, db: Session = Depends(get_db)):
    try:
        essay = essay_service.generate_essay(
            db=db,
            topic=request.topic,
            central_question=request.central_question,
            audience=request.audience,
            tone=request.tone,
            provider=request.provider,
            model=request.model,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Essay generation failure: {e}",
        )
    return _to_essay_response(essay)


@router.get("/essays/{essay_id}", response_model=EssayResponse)
def get_essay(essay_id: str, db: Session = Depends(get_db)):
    essay = essay_service.get_essay(db=db, essay_id=essay_id)
    if not essay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Essay '{essay_id}' not found."
        )
    return _to_essay_response(essay)



@router.get("/artifacts/{artifact_id}")
def get_artifact(artifact_id: str, db: Session = Depends(get_db)):
    """
    Retrieve generated editorial artifact (HTML and Markdown).
    """
    essay = essay_service.get_essay(db=db, essay_id=artifact_id)
    if not essay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact '{artifact_id}' not found."
        )
    return {
        "artifact_id": essay.id,
        "title": essay.title,
        "type": "essay",
        "topic": essay.topic,
        "word_count": essay.word_count,
        "markdown": essay.content_markdown,
        "html": essay.content_html,
        "sources": essay.sources or [],
        "created_at": essay.created_at,
    }
