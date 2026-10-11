import logging
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()


def init_db_engine():
    """
    Initialize SQLAlchemy engine.
    Prefers PostgreSQL if DATABASE_URL is configured and reachable;
    falls back to development SQLite database only if REQUIRE_POSTGRES is False.
    """
    db_url = settings.DATABASE_URL

    if db_url and db_url.startswith(("postgres://", "postgresql://", "postgresql+psycopg2://", "postgresql+psycopg://")):
        # Handle heroku-style postgres:// url prefix
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)

        max_retries = 5 if settings.REQUIRE_POSTGRES else 2
        last_error = None

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"Attempting connection to PostgreSQL (attempt {attempt}/{max_retries})...")
                test_engine = create_engine(db_url, pool_pre_ping=True)
                with test_engine.connect() as conn:
                    logger.info(f"Successfully connected to PostgreSQL database (driver: {test_engine.dialect.driver}).")
                return test_engine, "postgresql"
            except ModuleNotFoundError as mne:
                if "psycopg" in str(mne) and not db_url.startswith("postgresql+psycopg2://"):
                    logger.info("psycopg v3 not found, falling back to postgresql+psycopg2...")
                    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
                    continue
                last_error = mne
                logger.warning(f"PostgreSQL connection attempt {attempt} failed: {mne}")
                if attempt < max_retries:
                    time.sleep(2)
            except Exception as e:
                last_error = e
                logger.warning(f"PostgreSQL connection attempt {attempt} failed: {e}")
                if attempt < max_retries:
                    time.sleep(2)

        # If PostgreSQL was required (e.g. in Docker Compose / production), fail loudly!
        if settings.REQUIRE_POSTGRES:
            raise RuntimeError(
                f"[STRICT POSTGRES ERROR] REQUIRE_POSTGRES is True, but failed to connect to PostgreSQL at '{db_url}': {last_error}. "
                "Refusing to fall back to SQLite."
            )

        logger.warning(
            f"[DEVELOPMENT FALLBACK] Could not connect to PostgreSQL at '{db_url}': {last_error}. "
            f"Falling back to local SQLite development database: {settings.SQLITE_DEV_FALLBACK_URL}"
        )

    elif settings.REQUIRE_POSTGRES:
        raise RuntimeError(
            "[STRICT POSTGRES ERROR] REQUIRE_POSTGRES is True, but no valid PostgreSQL DATABASE_URL was provided. "
            "Refusing to fall back to SQLite."
        )

    # SQLite fallback for local development without Docker
    logger.info(
        f"[DEVELOPMENT FALLBACK] Using local SQLite database: {settings.SQLITE_DEV_FALLBACK_URL}. "
        "For PostgreSQL persistence, set DATABASE_URL (e.g., in .env or docker-compose)."
    )
    sqlite_engine = create_engine(
        settings.SQLITE_DEV_FALLBACK_URL,
        connect_args={"check_same_thread": False}
    )
    return sqlite_engine, "sqlite_dev_fallback"


engine, db_backend_type = init_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI Dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_status():
    """Return database dialect and connection status."""
    try:
        with engine.connect() as conn:
            return {
                "status": "connected",
                "backend": db_backend_type,
                "is_postgresql": db_backend_type == "postgresql",
                "is_dev_fallback": db_backend_type == "sqlite_dev_fallback",
            }
    except Exception as e:
        return {
            "status": "error",
            "backend": db_backend_type,
            "error": str(e),
        }
