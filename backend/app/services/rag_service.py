import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import chromadb
import ollama
from backend.app.config import settings

logger = logging.getLogger(__name__)


class RAGService:
    def __init__(self):
        self.db_path = Path(settings.CHROMA_DB_PATH).resolve()
        self.collection_name = settings.CHROMA_COLLECTION_NAME
        self.embedding_model = settings.OLLAMA_EMBEDDING_MODEL
        self._client: Optional[chromadb.PersistentClient] = None
        self._collection = None

    def _get_client(self) -> chromadb.PersistentClient:
        if self._client is None:
            if not self.db_path.exists():
                raise FileNotFoundError(
                    f"ChromaDB path does not exist at '{self.db_path}'. "
                    "Ensure CHROMA_DB_PATH points to the existing indexed database."
                )
            self._client = chromadb.PersistentClient(path=str(self.db_path))
        return self._client

    def get_collection(self):
        """
        Get existing collection. Never silently create an empty one.
        """
        if self._collection is None:
            client = self._get_client()
            existing_collections = [c.name for c in client.list_collections()]
            if self.collection_name not in existing_collections:
                raise ValueError(
                    f"Collection '{self.collection_name}' not found in ChromaDB. "
                    f"Available collections: {existing_collections}. "
                    "Please set CHROMA_COLLECTION_NAME in your environment."
                )
            self._collection = client.get_collection(self.collection_name)
            count = self._collection.count()
            if count == 0:
                logger.warning(f"Collection '{self.collection_name}' is empty (0 chunks).")
            else:
                logger.info(f"Loaded ChromaDB collection '{self.collection_name}' with {count} chunks.")
        return self._collection

    def get_status(self) -> Dict[str, Any]:
        """Check status of ChromaDB and the collection for health check."""
        try:
            client = self._get_client()
            existing_collections = [c.name for c in client.list_collections()]
            if self.collection_name in existing_collections:
                coll = client.get_collection(self.collection_name)
                count = coll.count()
                return {
                    "status": "ready",
                    "collection": self.collection_name,
                    "chunks_count": count,
                    "available_collections": existing_collections,
                    "db_path": str(self.db_path),
                }
            return {
                "status": "collection_missing",
                "collection": self.collection_name,
                "available_collections": existing_collections,
                "db_path": str(self.db_path),
            }
        except Exception as e:
            return {
                "status": "error",
                "collection": self.collection_name,
                "error": str(e),
                "db_path": str(self.db_path),
            }

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector using Ollama nomic-embed-text."""
        try:
            client = ollama.Client(host=settings.OLLAMA_BASE_URL)
            response = client.embed(model=self.embedding_model, input=text)
            embeddings = response.get("embeddings")
            if not embeddings or len(embeddings) == 0:
                raise RuntimeError("Ollama returned empty embeddings.")
            return embeddings[0]
        except Exception as e:
            logger.error(f"Error generating embedding with Ollama model '{self.embedding_model}': {e}")
            raise RuntimeError(f"Ollama embedding failure ({self.embedding_model}): {e}") from e

    def retrieve_passages(
        self, query: str, n_results: int = 5, where: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant transcript chunks from ChromaDB with real metadata.
        """
        collection = self.get_collection()
        query_embedding = self.generate_embedding(query)

        query_kwargs: Dict[str, Any] = {
            "query_embeddings": [query_embedding],
            "n_results": n_results,
            "include": ["documents", "metadatas", "distances"],
        }
        if where:
            query_kwargs["where"] = where

        results = collection.query(**query_kwargs)

        documents = results["documents"][0] if results.get("documents") else []
        metadatas = results["metadatas"][0] if results.get("metadatas") else []
        distances = results["distances"][0] if results.get("distances") else []

        sources: List[Dict[str, Any]] = []
        for i, (doc, meta, dist) in enumerate(zip(documents, metadatas, distances), start=1):
            relevance = max(0.0, round(1.0 - dist, 4)) if dist is not None else None
            sources.append({
                "id": f"S{i}",
                "title": str(meta.get("title", "Lenny's Podcast Episode")),
                "guest": str(meta.get("guest", "Podcast Guest")),
                "youtube_url": str(meta.get("youtube_url", "")),
                "publish_date": str(meta.get("publish_date", "")),
                "chunk_index": meta.get("chunk_index"),
                "excerpt": str(doc).strip(),
                "distance": round(float(dist), 4) if dist is not None else None,
                "relevance_score": relevance,
            })

        return sources

    def build_context(self, sources: List[Dict[str, Any]]) -> str:
        """Format retrieved passages into structured context for LLM."""
        context_parts = []
        for src in sources:
            context_parts.append(
                f"[{src['id']}]\n"
                f"Episode: {src['title']}\n"
                f"Guest: {src['guest']}\n"
                f"URL: {src['youtube_url']}\n"
                f"Transcript Passage:\n"
                f"{src['excerpt']}"
            )
        return "\n\n" + ("\n\n---\n\n".join(context_parts)) + "\n\n"


rag_service = RAGService()
