from typing import List, Iterable
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.db.models import Conversation, Message
from backend.app.schemas import (
    ConversationSummary,
    ConversationDetail,
    ConversationUpdate,
    MessageItem,
    SourceItem,
)
from backend.app.services.conversation_service import conversation_service

router = APIRouter(prefix="/conversations", tags=["Conversations"])


def _format_message(msg: Message) -> MessageItem:
    sources_list = [SourceItem(**s) for s in msg.sources] if msg.sources else None
    return MessageItem(
        id=msg.id,
        conversation_id=msg.conversation_id,
        role=msg.role,
        content=msg.content,
        sources=sources_list,
        created_at=msg.created_at,
    )


def _format_messages(messages: Iterable[Message]) -> List[MessageItem]:
    return [_format_message(msg) for msg in messages]


def _to_conversation_detail(conv: Conversation) -> ConversationDetail:
    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        model_provider=conv.model_provider,
        model_name=conv.model_name,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=_format_messages(conv.messages),
    )


@router.get("", response_model=List[ConversationSummary])
def list_conversations(db: Session = Depends(get_db)):
    return conversation_service.list_conversations(db=db)


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = conversation_service.get_conversation(db=db, conversation_id=conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found."
        )
    return _to_conversation_detail(conv)


@router.patch("/{conversation_id}", response_model=ConversationDetail)
def update_conversation(
    conversation_id: str,
    update_data: ConversationUpdate,
    db: Session = Depends(get_db),
):
    conv = conversation_service.update_conversation_title(
        db=db,
        conversation_id=conversation_id,
        new_title=update_data.title,
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found."
        )
    return _to_conversation_detail(conv)


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    success = conversation_service.delete_conversation(db=db, conversation_id=conversation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found."
        )
    return {"status": "deleted", "id": conversation_id}


@router.get("/{conversation_id}/messages", response_model=List[MessageItem])
def get_conversation_messages(conversation_id: str, db: Session = Depends(get_db)):
    conv = conversation_service.get_conversation(db=db, conversation_id=conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found."
        )
    messages = conversation_service.list_messages(db=db, conversation_id=conversation_id)
    return _format_messages(messages)

