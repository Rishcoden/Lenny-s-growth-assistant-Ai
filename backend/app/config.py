from pathlib import Path
from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_CHROMA_PATH = str(PROJECT_ROOT / "chroma_db")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(PROJECT_ROOT / ".env"), ".env"),
        extra="ignore",
    )

    APP_NAME: str = "Lenny Growth Assistant API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database: PostgreSQL by default, with labeled dev SQLite fallback if PostgreSQL is unconfigured
    DATABASE_URL: Optional[str] = None
    REQUIRE_POSTGRES: bool = False
    SQLITE_DEV_FALLBACK_URL: str = f"sqlite:///{PROJECT_ROOT}/lenny_growth_assistant.db"

    # Vector Database
    CHROMA_DB_PATH: str = DEFAULT_CHROMA_PATH
    CHROMA_COLLECTION_NAME: str = "lenny_podcast"

    # Ollama Local Models
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_CHAT_MODEL: str = "llama3.2"
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"

    # Default Provider
    DEFAULT_LLM_PROVIDER: str = "ollama"

    # Optional Cloud Providers
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("OPENAI_API_KEY", "ANTHROPIC_API_KEY", mode="before")
    @classmethod
    def clean_api_key(cls, v):
        if isinstance(v, str):
            v_stripped = v.strip()
            return v_stripped if v_stripped else None
        return v


settings = Settings()
