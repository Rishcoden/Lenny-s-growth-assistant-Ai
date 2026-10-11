import logging
from typing import Optional
from sqlalchemy.orm import Session
import markdown_it
from backend.app.db.models import GeneratedEssay
from backend.app.services.rag_service import rag_service
from backend.app.services.llm_service import llm_service, SYSTEM_PROMPT_ESSAY

logger = logging.getLogger(__name__)


class EssayService:
    def __init__(self):
        self.md_parser = markdown_it.MarkdownIt()

    def generate_essay(
        self,
        db: Session,
        topic: str,
        central_question: str,
        audience: Optional[str] = "Product leaders and growth practitioners",
        tone: Optional[str] = "Editorial, analytical, actionable",
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> GeneratedEssay:
        """
        Generate an editorial essay (~1,250 words) grounded in Lenny's Podcast transcripts.
        """
        # 1. Retrieve evidence across the topic and central question
        search_query = f"{topic}: {central_question}"
        sources = rag_service.retrieve_passages(query=search_query, n_results=8)
        context = rag_service.build_context(sources)

        # 2. Build detailed editorial prompt
        prompt = f"""Write a comprehensive editorial essay (~1,200 to 1,300 words) on the following topic and inquiry.

TOPIC: {topic}
CENTRAL QUESTION / THESIS: {central_question}
TARGET AUDIENCE: {audience}
EDITORIAL TONE: {tone}

TRANSCRIPT EVIDENCE:
{context}

ESSAY OUTLINE & INSTRUCTIONS:
- Create a compelling editorial headline (e.g. # Title) and subtitle (*Subtitle*).
- Formulate 4-5 substantive sections with clear Markdown H2 headings.
- Weave in concrete lessons, counter-intuitive insights, and frameworks directly from the guests in the transcript evidence.
- Include explicit inline citations pointing to the evidence (e.g., [S1], [S2]).
- Explicitly highlight trade-offs, common pitfalls, and tactical advice for product teams.
- Conclude with a strong synthesis section: "The Bottom Line for Builders".
- Ground your assertions strictly in the transcript passages provided above.
"""

        # 3. Generate essay through LLM
        essay_markdown, metadata = llm_service.generate_chat_response(
            prompt=prompt,
            provider=provider,
            model=model,
            system_prompt=SYSTEM_PROMPT_ESSAY,
        )

        # 4. Compute word count
        words = essay_markdown.split()
        word_count = len(words)

        # Extract title from markdown if available
        title = f"Editorial: {topic}"
        for line in essay_markdown.split("\n"):
            line = line.strip()
            if line.startswith("# "):
                title = line[2:].strip()
                break

        # 5. Render HTML
        content_html = self.md_parser.render(essay_markdown)

        # 6. Save in DB
        essay = GeneratedEssay(
            title=title,
            topic=topic,
            central_question=central_question,
            audience=audience,
            tone=tone,
            content_markdown=essay_markdown,
            content_html=content_html,
            word_count=word_count,
            sources=sources,
        )
        db.add(essay)
        db.commit()
        db.refresh(essay)
        return essay

    def get_essay(self, db: Session, essay_id: str) -> Optional[GeneratedEssay]:
        return db.query(GeneratedEssay).filter(GeneratedEssay.id == essay_id).first()

    def list_essays(self, db: Session, limit: int = 20):
        return db.query(GeneratedEssay).order_by(GeneratedEssay.created_at.desc()).limit(limit).all()


essay_service = EssayService()
