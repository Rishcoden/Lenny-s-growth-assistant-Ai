import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.db.models import Conversation, Message, SavedInsight

logger = logging.getLogger(__name__)


class ConversationService:
    def get_or_create_conversation(
        self,
        db: Session,
        conversation_id: Optional[str] = None,
        initial_title: Optional[str] = None,
        provider: str = "ollama",
        model: str = "llama3.2",
    ) -> Conversation:
        if conversation_id:
            conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
            if conv:
                conv.model_provider = provider
                conv.model_name = model
                db.commit()
                db.refresh(conv)
                return conv

        # Create new conversation
        title = initial_title[:60] if initial_title else "New Research Conversation"
        conv = Conversation(
            title=title,
            model_provider=provider,
            model_name=model,
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    def add_message(
        self,
        db: Session,
        conversation_id: str,
        role: str,
        content: str,
        sources: Optional[List[Dict[str, Any]]] = None,
        model_metadata: Optional[Dict[str, Any]] = None,
    ) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            sources=sources,
            model_metadata=model_metadata,
        )
        db.add(msg)

        # Update conversation title if it's the first user message and default title
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            if role == "user" and (conv.title == "New Research Conversation" or conv.title == "New Conversation"):
                clean_title = content.strip().split("\n")[0][:60]
                if clean_title:
                    conv.title = clean_title
            conv.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(msg)
        return msg

    def list_conversations(self, db: Session, limit: int = 50) -> List[Dict[str, Any]]:
        conversations = (
            db.query(Conversation)
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
            .all()
        )
        result = []
        for c in conversations:
            count = db.query(Message).filter(Message.conversation_id == c.id).count()
            result.append({
                "id": c.id,
                "title": c.title,
                "model_provider": c.model_provider,
                "model_name": c.model_name,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
                "message_count": count,
            })
        return result

    def get_conversation(self, db: Session, conversation_id: str) -> Optional[Conversation]:
        return db.query(Conversation).filter(Conversation.id == conversation_id).first()

    def update_conversation_title(self, db: Session, conversation_id: str, new_title: str) -> Optional[Conversation]:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            conv.title = new_title.strip()
            db.commit()
            db.refresh(conv)
        return conv

    def delete_conversation(self, db: Session, conversation_id: str) -> bool:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            db.delete(conv)
            db.commit()
            return True
        return False

    def list_messages(self, db: Session, conversation_id: str) -> List[Message]:
        return (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .all()
        )

    # ---------------- Saved Insights ----------------
    def create_saved_insight(
        self,
        db: Session,
        title: str,
        content: str,
        sources: Optional[List[Dict[str, Any]]] = None,
        conversation_id: Optional[str] = None,
        topic: Optional[str] = None,
    ) -> SavedInsight:
        insight = SavedInsight(
            title=title,
            content=content,
            sources=sources,
            conversation_id=conversation_id,
            topic=topic,
        )
        db.add(insight)
        db.commit()
        db.refresh(insight)
        return insight

    def list_saved_insights(self, db: Session, limit: int = 50) -> List[SavedInsight]:
        return (
            db.query(SavedInsight)
            .order_by(SavedInsight.created_at.desc())
            .limit(limit)
            .all()
        )

    def delete_saved_insight(self, db: Session, insight_id: str) -> bool:
        insight = db.query(SavedInsight).filter(SavedInsight.id == insight_id).first()
        if insight:
            db.delete(insight)
            db.commit()
            return True
        return False


conversation_service = ConversationService()
