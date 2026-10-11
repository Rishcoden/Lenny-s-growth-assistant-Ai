import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.schemas import ChatRequest, ChatResponse, SourceItem
from backend.app.services.rag_service import rag_service
from backend.app.services.llm_service import llm_service
from backend.app.services.conversation_service import conversation_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    user_text = request.message.strip()
    if not user_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )

    provider = request.provider or "ollama"
    model = request.model or ("llama3.2" if provider == "ollama" else None)

    # 1. Retrieve or create conversation
    conv = conversation_service.get_or_create_conversation(
        db=db,
        conversation_id=request.conversation_id,
        initial_title=user_text,
        provider=provider,
        model=model or "default",
    )

    # 2. Persist user message
    user_msg = conversation_service.add_message(
        db=db,
        conversation_id=conv.id,
        role="user",
        content=user_text,
    )

    # 3. Retrieve relevant evidence from ChromaDB
    try:
        sources_data = rag_service.retrieve_passages(query=user_text, n_results=5)
    except Exception as e:
        logger.error(f"Error retrieving ChromaDB passages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector search retrieval failure: {e}",
        )

    # 4. Build context
    context = rag_service.build_context(sources_data)

    # 5. Build prompt
    prompt = f"""USER QUESTION:
{user_text}

TRANSCRIPT EVIDENCE:
{context}

Please provide an authoritative, grounded answer addressing the user question using the transcript evidence above. Cite claims with [S1], [S2], etc. If evidence is insufficient, clearly state that.
"""

    # 6. Generate answer
    try:
        answer, metadata = llm_service.generate_chat_response(
            prompt=prompt,
            provider=provider,
            model=model,
        )
    except ValueError as e:
        logger.warning(f"Invalid model/provider: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error generating LLM answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Model generation failure: {e}",
        )

    # 7. Persist assistant message
    asst_msg = conversation_service.add_message(
        db=db,
        conversation_id=conv.id,
        role="assistant",
        content=answer,
        sources=sources_data,
        model_metadata=metadata,
    )

    formatted_sources = [SourceItem(**s) for s in sources_data]

    return ChatResponse(
        conversation_id=conv.id,
        message_id=asst_msg.id,
        answer=answer,
        sources=formatted_sources,
        provider=metadata.get("provider", provider),
        model=metadata.get("model", model or "unknown"),
        created_at=asst_msg.created_at,
    )
