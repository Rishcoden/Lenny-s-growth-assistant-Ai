from fastapi import APIRouter
from backend.app.services.rag_service import rag_service

router = APIRouter(prefix="/discover", tags=["Discover"])

FEATURED_TOPICS = [
    {
        "id": "growth-loops",
        "title": "Growth Loops & Viral Engine",
        "description": "How compound acquisition loops outperform linear marketing funnels.",
        "icon": "Repeat",
        "sample_questions": [
            "How do product-led growth loops actually work?",
            "What is the difference between viral loops and content loops?",
            "How do early-stage startups find their growth channel?",
        ],
        "tags": ["Growth", "Acquisition", "PLG"]
    },
    {
        "id": "retention",
        "title": "User Retention & Churn",
        "description": "Retention curves, habit loops, and the root causes of user churn.",
        "icon": "Activity",
        "sample_questions": [
            "Why do users abandon products after signup?",
            "How do top consumer and B2B products bend the retention curve?",
            "What metrics indicate genuine product-market fit retention?",
        ],
        "tags": ["Retention", "Engagement", "Analytics"]
    },
    {
        "id": "product-strategy",
        "title": "Product Strategy & Roadmaps",
        "description": "Making hard trade-offs, positioning, and saying no to good ideas.",
        "icon": "Compass",
        "sample_questions": [
            "How should founders prioritize competing product opportunities?",
            "What separates a great product strategy from a feature backlog?",
            "How do companies like Airbnb and Figma develop product vision?",
        ],
        "tags": ["Strategy", "Vision", "Prioritization"]
    },
    {
        "id": "pm-excellence",
        "title": "Product Management Craft",
        "description": "The skills, behaviors, and judgment that separate top 1% PMs.",
        "icon": "Award",
        "sample_questions": [
            "What separates good product managers from great ones?",
            "How do great PMs influence without authority?",
            "What are the biggest mistakes newly promoted PM leaders make?",
        ],
        "tags": ["Leadership", "Career", "Execution"]
    },
    {
        "id": "pmf",
        "title": "Product-Market Fit",
        "description": "Recognizing true pull versus false signals in the early days.",
        "icon": "Target",
        "sample_questions": [
            "How do founders know when they truly have product-market fit?",
            "What are the best frameworks to pivot when retention is flat?",
            "How did Superhuman measure product-market fit engine?",
        ],
        "tags": ["0 to 1", "Founders", "PMF"]
    },
    {
        "id": "hiring-teams",
        "title": "Hiring & High-Performing Teams",
        "description": "Building product teams that move with speed, agency, and taste.",
        "icon": "Users",
        "sample_questions": [
            "How do top tech companies interview and hire product leaders?",
            "What team structures scale best from Series A to IPO?",
            "How do leaders maintain product velocity as the team grows?",
        ],
        "tags": ["Hiring", "Culture", "Org Design"]
    },
]


@router.get("/topics")
def get_featured_topics():
    return {"topics": FEATURED_TOPICS}


@router.get("/topic-sources")
def get_topic_sources(topic: str, limit: int = 4):
    """Retrieve actual podcast citations matching a topic for discovery browsing."""
    try:
        sources = rag_service.retrieve_passages(query=topic, n_results=limit)
        return {"topic": topic, "sources": sources}
    except Exception as e:
        return {"topic": topic, "sources": [], "error": str(e)}
