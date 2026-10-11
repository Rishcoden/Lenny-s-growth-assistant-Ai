from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


# -----------------------------------------------------------------------------
# Source / Citation Schemas
# -----------------------------------------------------------------------------
class SourceItem(BaseModel):
    id: str = Field(..., description="Citation identifier, e.g. S1")
    title: str = Field(..., description="Episode title")
    guest: str = Field(..., description="Episode guest")
    youtube_url: str = Field("", description="YouTube URL")
    publish_date: Optional[str] = Field("", description="Publish date")
    chunk_index: Optional[int] = Field(None, description="Transcript chunk index")
    excerpt: str = Field(..., description="Verbatim transcript excerpt")
    distance: Optional[float] = Field(None, description="Cosine distance metric")
    relevance_score: Optional[float] = Field(None, description="Normalized relevance score")


# -----------------------------------------------------------------------------
# Chat Schemas
# -----------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="User query or message")
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID")
    provider: Optional[str] = Field(None, description="LLM provider: ollama, openai, or anthropic")
    model: Optional[str] = Field(None, description="Model identifier")


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    answer: str
    sources: List[SourceItem] = []
    provider: str
    model: str
    created_at: datetime


# -----------------------------------------------------------------------------
# Message & Conversation Schemas
# -----------------------------------------------------------------------------
class MessageItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    role: str
    content: str
    sources: Optional[List[SourceItem]] = None
    created_at: datetime


class ConversationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    model_provider: str
    model_name: str
    created_at: datetime
    updated_at: datetime
    message_count: int


class ConversationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    model_provider: str
    model_name: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageItem] = []


class ConversationUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


# -----------------------------------------------------------------------------
# Saved Insight Schemas
# -----------------------------------------------------------------------------
class SavedInsightCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    sources: Optional[List[SourceItem]] = None
    conversation_id: Optional[str] = None
    topic: Optional[str] = None


class SavedInsightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    content: str
    sources: Optional[List[SourceItem]] = None
    conversation_id: Optional[str] = None
    topic: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# -----------------------------------------------------------------------------
# Essay Studio Schemas
# -----------------------------------------------------------------------------
class EssayCreateRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200, description="Primary topic")
    central_question: str = Field(..., min_length=5, max_length=1000, description="Thesis or central inquiry")
    audience: Optional[str] = Field("Product leaders and growth practitioners", max_length=200)
    tone: Optional[str] = Field("Editorial, analytical, actionable", max_length=100)
    provider: Optional[str] = None
    model: Optional[str] = None


class EssayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    topic: str
    central_question: str
    audience: Optional[str]
    tone: Optional[str]
    content_markdown: str
    content_html: str
    word_count: int
    sources: List[SourceItem] = []
    created_at: datetime
    updated_at: datetime


# -----------------------------------------------------------------------------
# Model Schemas
# -----------------------------------------------------------------------------
class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    is_local: bool
    configured: bool
    is_default: bool
    description: Optional[str] = None


class ModelListResponse(BaseModel):
    models: List[ModelInfo]
    default_provider: str


# -----------------------------------------------------------------------------
# Health Schema
# -----------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    app_version: str
    database: Dict[str, Any]
    chromadb: Dict[str, Any]
    ollama: Dict[str, Any]
