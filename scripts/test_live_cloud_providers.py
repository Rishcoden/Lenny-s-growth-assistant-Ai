"""
Utility script to safely verify configured cloud providers (OpenAI & Anthropic)
without logging or exposing API key values.
"""
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.config import settings
from backend.app.services.llm_service import llm_service


def test_openai():
    print("\n--- Testing OpenAI Provider ---")
    if not settings.OPENAI_API_KEY:
        print("Status: UNCONFIGURED (OPENAI_API_KEY is empty in .env)")
        return False

    print(f"Model: {settings.OPENAI_MODEL}")
    try:
        answer, metadata = llm_service.generate_chat_response(
            prompt="Respond in 5 words or fewer: Testing OpenAI connection.",
            provider="openai",
        )
        print("Status: SUCCESS")
        print(f"Response: {answer.strip()}")
        print(f"Metadata: {metadata}")
        return True
    except Exception as e:
        print(f"Status: FAILED")
        print(f"Error (sanitized): {e}")
        return False


def test_anthropic():
    print("\n--- Testing Anthropic Provider ---")
    if not settings.ANTHROPIC_API_KEY:
        print("Status: UNCONFIGURED (ANTHROPIC_API_KEY is empty in .env)")
        return False

    print(f"Model: {settings.ANTHROPIC_MODEL}")
    try:
        answer, metadata = llm_service.generate_chat_response(
            prompt="Respond in 5 words or fewer: Testing Anthropic connection.",
            provider="anthropic",
        )
        print("Status: SUCCESS")
        print(f"Response: {answer.strip()}")
        print(f"Metadata: {metadata}")
        return True
    except Exception as e:
        print(f"Status: FAILED")
        print(f"Error (sanitized): {e}")
        return False


if __name__ == "__main__":
    openai_ok = test_openai()
    anthropic_ok = test_anthropic()
    if not (openai_ok or anthropic_ok):
        print("\nNote: Please add your API keys to .env and re-run.")
