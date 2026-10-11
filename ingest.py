from pathlib import Path
import os
import hashlib
import re

import chromadb
import ollama
import yaml


# ============================================================
# Paths
# ============================================================

REPO_ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("TRANSCRIPTS_DIR", Path.home() / "lennys-podcast-transcripts" / "episodes"))
DB_DIR = Path(os.environ.get("CHROMA_DB_PATH", REPO_ROOT / "chroma_db"))



# ============================================================
# Configuration
# ============================================================

# Keep the original collection for comparison.
COLLECTION_NAME = "lenny_podcast_v2"

EMBEDDING_MODEL = "nomic-embed-text"

CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200

# Number of documents processed per embedding batch.
BATCH_SIZE = 32


# ============================================================
# Load transcript and metadata
# ============================================================

def load_transcript(file_path: Path):
    """
    Load a Markdown transcript and its YAML front matter.

    Returns:
        metadata: Dictionary containing episode information.
        text: Transcript body without YAML front matter.
    """

    content = file_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    metadata = {}

    # Parse YAML front matter.
    if content.startswith("---"):
        parts = content.split("---", 2)

        if len(parts) == 3:
            try:
                metadata = yaml.safe_load(parts[1]) or {}

                if not isinstance(metadata, dict):
                    metadata = {}

            except yaml.YAMLError as error:
                print(
                    f"Warning: Could not parse metadata in "
                    f"{file_path}: {error}"
                )

            content = parts[2]

    # Remove the Markdown title and other introductory content
    # when a transcript section exists.
    marker = "## Transcript"

    if marker in content:
        content = content.split(marker, 1)[1]

    return metadata, content.strip()


# ============================================================
# Text chunking
# ============================================================

def split_long_paragraph(paragraph: str):
    """
    Split a paragraph that exceeds CHUNK_SIZE.

    Prefer sentence boundaries when possible.
    Use overlapping character windows when necessary.
    """

    chunks = []
    start = 0
    paragraph_length = len(paragraph)

    while start < paragraph_length:
        end = min(start + CHUNK_SIZE, paragraph_length)

        if end < paragraph_length:
            # Prefer a sentence boundary.
            sentence_boundary = paragraph.rfind(
                ". ",
                start,
                end,
            )

            # Also consider question and exclamation marks.
            question_boundary = paragraph.rfind(
                "? ",
                start,
                end,
            )

            exclamation_boundary = paragraph.rfind(
                "! ",
                start,
                end,
            )

            boundary = max(
                sentence_boundary,
                question_boundary,
                exclamation_boundary,
            )

            # Use a sentence boundary only if it is reasonably
            # far into the current chunk.
            if boundary > start + CHUNK_SIZE // 2:
                end = boundary + 1

        chunk = paragraph[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= paragraph_length:
            break

        # Overlap consecutive pieces of a long paragraph.
        start = max(
            end - CHUNK_OVERLAP,
            start + 1,
        )

    return chunks


def split_text(text: str):
    """
    Split transcript text into paragraph-aware chunks.

    Short paragraphs are grouped together.
    Paragraphs are kept intact whenever possible.
    Long paragraphs are split at sentence boundaries.
    Complete paragraphs are reused for overlap when possible.
    """

    # Normalize line endings.
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Split on one or more blank lines.
    paragraphs = [
        paragraph.strip()
        for paragraph in re.split(r"\n\s*\n", text)
        if paragraph.strip()
    ]

    chunks = []

    current_paragraphs = []
    current_length = 0

    for paragraph in paragraphs:

        # Handle an unusually long paragraph separately.
        if len(paragraph) > CHUNK_SIZE:

            # Save the current chunk first.
            if current_paragraphs:
                chunks.append(
                    "\n\n".join(current_paragraphs)
                )

            current_paragraphs = []
            current_length = 0

            chunks.extend(
                split_long_paragraph(paragraph)
            )

            continue

        # Account for the blank line between paragraphs.
        added_length = len(paragraph)

        if current_paragraphs:
            added_length += 2

        # Start a new chunk if this paragraph will exceed
        # the configured size.
        if (
            current_paragraphs
            and current_length + added_length > CHUNK_SIZE
        ):

            chunks.append(
                "\n\n".join(current_paragraphs)
            )

            # Preserve overlap using complete paragraphs.
            overlap_paragraphs = []
            overlap_length = 0

            for previous in reversed(current_paragraphs):

                separator_length = (
                    2 if overlap_paragraphs else 0
                )

                required_length = (
                    len(previous) + separator_length
                )

                if (
                    overlap_length + required_length
                    > CHUNK_OVERLAP
                ):
                    break

                overlap_paragraphs.insert(
                    0,
                    previous,
                )

                overlap_length += required_length

            current_paragraphs = overlap_paragraphs

            current_length = (
                sum(
                    len(item)
                    for item in current_paragraphs
                )
                + max(
                    0,
                    len(current_paragraphs) - 1,
                ) * 2
            )

        # Add the next paragraph.
        if current_paragraphs:
            current_length += 2

        current_paragraphs.append(paragraph)

        current_length += len(paragraph)

    # Save the last chunk.
    if current_paragraphs:
        chunks.append(
            "\n\n".join(current_paragraphs)
        )

    # Remove empty chunks.
    return [
        chunk.strip()
        for chunk in chunks
        if chunk.strip()
    ]


# ============================================================
# Generate embeddings using Ollama
# ============================================================

def get_embeddings(texts: list[str]):
    """
    Generate embeddings for multiple documents in one Ollama
    request.

    Returns a list of embedding vectors.
    """

    response = ollama.embed(
        model=EMBEDDING_MODEL,
        input=texts,
    )

    embeddings = response.get("embeddings")

    if embeddings is None:
        raise RuntimeError(
            "Ollama did not return embeddings."
        )

    if len(embeddings) != len(texts):
        raise RuntimeError(
            f"Expected {len(texts)} embeddings, "
            f"received {len(embeddings)}."
        )

    return embeddings


# ============================================================
# Main ingestion pipeline
# ============================================================

def main():

    # Verify that the transcript repository exists.
    if not DATA_DIR.exists():
        raise FileNotFoundError(
            f"Transcript directory not found: {DATA_DIR}"
        )

    # Verify that Ollama is running and the embedding model
    # is available.
    try:
        ollama.show(EMBEDDING_MODEL)

    except Exception as error:
        raise RuntimeError(
            f"Could not access Ollama model "
            f"'{EMBEDDING_MODEL}'. "
            f"Make sure Ollama is running and the model "
            f"is installed. Original error: {error}"
        ) from error

    # Initialize ChromaDB.
    DB_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    client = chromadb.PersistentClient(
        path=str(DB_DIR)
    )

    # Create or reuse the improved collection.
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={
            "hnsw:space": "cosine",
        },
    )

    # Find all podcast transcripts.
    transcript_files = sorted(
        DATA_DIR.rglob("transcript.md")
    )

    if not transcript_files:
        raise RuntimeError(
            f"No transcript.md files found in {DATA_DIR}"
        )

    print("=" * 60)
    print("LENNY'S PODCAST RAG - INGESTION")
    print("=" * 60)

    print(f"Transcript files: {len(transcript_files)}")
    print(f"Embedding model: {EMBEDDING_MODEL}")
    print(f"Chunk size: {CHUNK_SIZE}")
    print(f"Chunk overlap: {CHUNK_OVERLAP}")
    print(f"Collection: {COLLECTION_NAME}")
    print(f"Database: {DB_DIR}")
    print("=" * 60)

    pending_ids = []
    pending_documents = []
    pending_metadatas = []

    processed_chunks = 0
    failed_files = 0

    def flush_batch():
        """
        Embed and save the current batch.

        Returns the number of chunks successfully saved.
        """

        nonlocal processed_chunks

        if not pending_ids:
            return 0

        embeddings = get_embeddings(
            pending_documents
        )

        collection.upsert(
            ids=pending_ids,
            documents=pending_documents,
            metadatas=pending_metadatas,
            embeddings=embeddings,
        )

        count = len(pending_ids)

        processed_chunks += count

        pending_ids.clear()
        pending_documents.clear()
        pending_metadatas.clear()

        return count

    # Process each transcript.
    for file_number, file_path in enumerate(
        transcript_files,
        start=1,
    ):

        try:
            metadata, text = load_transcript(
                file_path
            )

            if not text:
                print(
                    f"Skipping empty transcript: {file_path}"
                )
                continue

            chunks = split_text(text)

            if not chunks:
                print(
                    f"Skipping transcript with no chunks: "
                    f"{file_path}"
                )
                continue

            title = str(
                metadata.get("title")
                or file_path.parent.name
            )

            guest = str(
                metadata.get("guest")
                or "Unknown"
            )

            youtube_url = str(
                metadata.get("youtube_url")
                or ""
            )

            publish_date = str(
                metadata.get("publish_date")
                or ""
            )

            # Build document IDs and metadata.
            for index, chunk in enumerate(chunks):

                # Include the chunk text in the ID so that
                # changed chunk contents receive new IDs.
                chunk_id = hashlib.sha256(
                    (
                        f"{file_path}:"
                        f"{index}:"
                        f"{chunk}"
                    ).encode("utf-8")
                ).hexdigest()

                pending_ids.append(chunk_id)

                pending_documents.append(chunk)

                pending_metadatas.append({
                    "title": title,
                    "guest": guest,
                    "youtube_url": youtube_url,
                    "publish_date": publish_date,
                    "chunk_index": index,
                    "source_file": str(file_path),
                })

                # Flush batches as they fill.
                if len(pending_ids) >= BATCH_SIZE:
                    flush_batch()

            print(
                f"[{file_number}/{len(transcript_files)}] "
                f"{title} - {len(chunks)} chunks"
            )

        except Exception as error:
            failed_files += 1

            print(
                f"ERROR processing {file_path}: {error}"
            )

    # Save remaining chunks.
    flush_batch()

    print("\n" + "=" * 60)
    print("INGESTION COMPLETE")
    print("=" * 60)

    print(
        f"Transcript files found: "
        f"{len(transcript_files)}"
    )

    print(
        f"Files that failed: {failed_files}"
    )

    print(
        f"Chunks processed: {processed_chunks}"
    )

    print(
        f"Chunks in collection: {collection.count()}"
    )

    print(
        f"Collection name: {COLLECTION_NAME}"
    )

    print(
        f"Database location: {DB_DIR}"
    )

    print("=" * 60)


if __name__ == "__main__":
    main()