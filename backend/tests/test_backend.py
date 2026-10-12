import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import Base, engine, SessionLocal
from backend.app.db.models import Conversation

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "chromadb" in data
    assert "ollama" in data


def test_models_endpoint():
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert len(data["models"]) >= 3
    providers = [m["provider"] for m in data["models"]]
    assert "ollama" in providers


def test_chat_empty_message_validation():
    response = client.post("/api/chat", json={"message": ""})
    assert response.status_code in (400, 422)


def test_chat_missing_message_validation():
    response = client.post("/api/chat", json={})
    assert response.status_code == 422


def test_conversation_crud_flow():
    # 1. Create a conversation in database
    db = SessionLocal()
    conv = Conversation(title="Testing Retention Dynamics", model_provider="ollama", model_name="llama3.2")
    db.add(conv)
    db.commit()
    db.refresh(conv)
    conv_id = conv.id
    db.close()

    # 2. Get conversations list
    response = client.get("/api/conversations")
    assert response.status_code == 200
    conv_list = response.json()
    assert any(c["id"] == conv_id for c in conv_list)

    # 3. Get single conversation
    response = client.get(f"/api/conversations/{conv_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == conv_id
    assert data["title"] == "Testing Retention Dynamics"

    # 4. Patch conversation title
    patch_resp = client.patch(f"/api/conversations/{conv_id}", json={"title": "Updated Strategy Topic"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["title"] == "Updated Strategy Topic"

    # 5. Delete conversation
    del_resp = client.delete(f"/api/conversations/{conv_id}")
    assert del_resp.status_code == 200

    # 6. Verify 404 after deletion
    get_del = client.get(f"/api/conversations/{conv_id}")
    assert get_del.status_code == 404


def test_saved_insights_flow():
    create_resp = client.post(
        "/api/saved-insights",
        json={
            "title": "Elena Verna on PLG loops",
            "content": "Product-led sales layers on top of high product-market fit self-serve loops.",
            "topic": "Growth Loops",
            "sources": [
                {
                    "id": "S1",
                    "title": "Elena Verna Interview",
                    "guest": "Elena Verna",
                    "youtube_url": "https://youtube.com/watch?v=IHwS2By9UKM",
                    "excerpt": "PLG starts with the user...",
                    "distance": 0.25,
                }
            ],
        },
    )
    assert create_resp.status_code == 200
    insight_data = create_resp.json()
    insight_id = insight_data["id"]
    assert insight_data["title"] == "Elena Verna on PLG loops"
    assert len(insight_data["sources"]) == 1

    list_resp = client.get("/api/saved-insights")
    assert list_resp.status_code == 200
    insights = list_resp.json()
    assert any(i["id"] == insight_id for i in insights)

    del_resp = client.delete(f"/api/saved-insights/{insight_id}")
    assert del_resp.status_code == 200


def test_discover_endpoints():
    resp = client.get("/api/discover/topics")
    assert resp.status_code == 200
    data = resp.json()
    assert "topics" in data
    assert len(data["topics"]) > 0


@patch("backend.app.api.chat.rag_service.retrieve_passages")
@patch("backend.app.api.chat.llm_service.generate_chat_response")
def test_chat_mocked_success(mock_llm, mock_rag):
    mock_rag.return_value = [
        {
            "id": "S1",
            "title": "Elena Verna on Growth",
            "guest": "Elena Verna",
            "youtube_url": "https://youtube.com/watch?v=test",
            "publish_date": "2024-01-01",
            "chunk_index": 1,
            "excerpt": "Retention is the engine of all growth loops.",
            "distance": 0.21,
            "relevance_score": 0.79,
        }
    ]
    mock_llm.return_value = (
        "According to Elena Verna [S1], retention is the foundation of growth loops.",
        {"provider": "ollama", "model": "llama3.2"},
    )

    response = client.post(
        "/api/chat",
        json={"message": "What is the role of retention in growth?"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "conversation_id" in data
    assert "Elena Verna" in data["answer"]
    assert len(data["sources"]) == 1
    assert data["sources"][0]["id"] == "S1"
    assert data["sources"][0]["guest"] == "Elena Verna"


@patch("backend.app.api.chat.rag_service.retrieve_passages")
def test_unsupported_provider_fails_safely(mock_rag):
    mock_rag.return_value = []
    response = client.post(
        "/api/chat",
        json={"message": "Test question", "provider": "unsupported_provider"},
    )
    assert response.status_code == 400
    assert "Unsupported LLM provider" in response.json()["detail"]


def test_essay_and_artifact_flow():
    from backend.app.services.rag_service import rag_service
    from backend.app.services.llm_service import llm_service
    with patch.object(rag_service, "retrieve_passages") as mock_rag, \
         patch.object(llm_service, "generate_chat_response") as mock_llm:
        mock_rag.return_value = [
            {
                "id": "S1",
                "title": "Casey Winters on Growth Loops",
                "guest": "Casey Winters",
                "youtube_url": "https://youtube.com/watch?v=casey",
                "publish_date": "2023-01-01",
                "chunk_index": 5,
                "excerpt": "Growth loops are closed systems where an input generates an output...",
                "distance": 0.18,
                "relevance_score": 0.82,
            }
        ]
        mock_llm.return_value = (
            "# The Anatomy of Modern Growth Loops\n\n*Why funnels fail and loops compound.*\n\n## 1. The Death of the Linear Funnel\n\nAccording to Casey Winters [S1], growth is never a funnel...",
            {"provider": "ollama", "model": "llama3.2"},
        )

        create_resp = client.post(
            "/api/essays",
            json={
                "topic": "Growth Loops",
                "central_question": "Why do growth loops outperform traditional acquisition funnels?",
                "audience": "Growth PMs and Founders",
                "tone": "Editorial, analytical",
            },
        )
        assert create_resp.status_code == 200
        essay_data = create_resp.json()
        assert "id" in essay_data
        assert essay_data["topic"] == "Growth Loops"
        assert "Growth Loops" in essay_data["title"]
        essay_id = essay_data["id"]

        # Test GET /api/essays/{essay_id}
        get_resp = client.get(f"/api/essays/{essay_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == essay_id

        # Test GET /api/artifacts/{artifact_id}
        artifact_resp = client.get(f"/api/artifacts/{essay_id}")
        assert artifact_resp.status_code == 200
        art = artifact_resp.json()
        assert art["artifact_id"] == essay_id
        assert "html" in art
        assert "markdown" in art
        assert "<h1" in art["html"]


def test_openai_unconfigured_error():
    from backend.app.config import settings
    from backend.app.services.llm_service import llm_service
    with patch.object(settings, "OPENAI_API_KEY", None):
        with pytest.raises(ValueError) as exc:
            llm_service.generate_chat_response("test", provider="openai")
        assert "OPENAI_API_KEY is not configured" in str(exc.value)


def test_anthropic_unconfigured_error():
    from backend.app.config import settings
    from backend.app.services.llm_service import llm_service
    with patch.object(settings, "ANTHROPIC_API_KEY", None):
        with pytest.raises(ValueError) as exc:
            llm_service.generate_chat_response("test", provider="anthropic")
        assert "ANTHROPIC_API_KEY is not configured" in str(exc.value)


def test_error_sanitization_masks_api_keys():
    from backend.app.services.llm_service import _sanitize_error
    from backend.app.config import settings
    with patch.object(settings, "OPENAI_API_KEY", "mock-openai-secret-key-for-testing"), \
         patch.object(settings, "ANTHROPIC_API_KEY", "mock-anthropic-secret-key-for-testing"):
        raw_error = Exception("Invalid key: mock-openai-secret-key-for-testing or mock-anthropic-secret-key-for-testing")
        sanitized = _sanitize_error(raw_error)
        assert "mock-openai-secret-key" not in sanitized
        assert "mock-anthropic-secret-key" not in sanitized
        assert "[REDACTED_API_KEY]" in sanitized


@patch("backend.app.api.chat.rag_service.retrieve_passages")
@patch("backend.app.api.chat.llm_service.generate_chat_response")
def test_openai_chat_endpoint_mocked(mock_llm, mock_rag):
    mock_rag.return_value = []
    mock_llm.return_value = (
        "OpenAI answer grounded in transcripts",
        {"provider": "openai", "model": "gpt-4o-mini"},
    )
    response = client.post(
        "/api/chat",
        json={"message": "Test question", "provider": "openai", "model": "gpt-4o-mini"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "openai"
    assert data["model"] == "gpt-4o-mini"
    assert "OpenAI answer" in data["answer"]


@patch("backend.app.api.chat.rag_service.retrieve_passages")
@patch("backend.app.api.chat.llm_service.generate_chat_response")
def test_anthropic_chat_endpoint_mocked(mock_llm, mock_rag):
    mock_rag.return_value = []
    mock_llm.return_value = (
        "Claude answer grounded in transcripts",
        {"provider": "anthropic", "model": "claude-3-5-sonnet-20241022"},
    )
    response = client.post(
        "/api/chat",
        json={"message": "Test question", "provider": "anthropic", "model": "claude-3-5-sonnet"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "anthropic"
    assert data["model"] == "claude-3-5-sonnet-20241022"
    assert "Claude answer" in data["answer"]
