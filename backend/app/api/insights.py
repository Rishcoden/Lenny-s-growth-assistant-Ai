from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.schemas import SavedInsightCreate, SavedInsightResponse, SourceItem
from backend.app.services.conversation_service import conversation_service

router = APIRouter(prefix="/saved-insights", tags=["Saved Insights"])


def _to_insight_response(item) -> SavedInsightResponse:
    src_items = [SourceItem(**s) for s in item.sources] if item.sources else None
    return SavedInsightResponse(
        id=item.id,
        title=item.title,
        content=item.content,
        sources=src_items,
        conversation_id=item.conversation_id,
        topic=item.topic,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get("", response_model=List[SavedInsightResponse])
def list_saved_insights(db: Session = Depends(get_db)):
    insights = conversation_service.list_saved_insights(db=db)
    return [_to_insight_response(item) for item in insights]


@router.post("", response_model=SavedInsightResponse)
def create_saved_insight(request: SavedInsightCreate, db: Session = Depends(get_db)):
    sources_dict = [s.model_dump() for s in request.sources] if request.sources else None
    insight = conversation_service.create_saved_insight(
        db=db,
        title=request.title,
        content=request.content,
        sources=sources_dict,
        conversation_id=request.conversation_id,
        topic=request.topic,
    )
    return _to_insight_response(insight)


@router.delete("/{insight_id}")
def delete_saved_insight(insight_id: str, db: Session = Depends(get_db)):
    success = conversation_service.delete_saved_insight(db=db, insight_id=insight_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Saved insight '{insight_id}' not found."
        )
    return {"status": "deleted", "id": insight_id}
