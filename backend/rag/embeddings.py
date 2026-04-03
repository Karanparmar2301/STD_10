"""
embeddings.py — Shared embedding model (BAAI/bge-large-en-v1.5, 1024-dim).
Loaded once at import time and reused across the pipeline.
"""
import os
import logging
import threading
from dotenv import load_dotenv
from qdrant_client import QdrantClient

try:
    from langchain_huggingface import HuggingFaceEmbeddings
except ImportError:
    from langchain_community.embeddings import HuggingFaceEmbeddings

logger = logging.getLogger(__name__)

# Load env from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)
load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333").strip()
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "class10_textbooks"
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-large-en-v1.5")

try:
    QDRANT_TIMEOUT_SECONDS = max(2, int(float(os.getenv("QDRANT_TIMEOUT_SECONDS", "8"))))
except ValueError:
    QDRANT_TIMEOUT_SECONDS = 8

_embedding_model = None
_qdrant_client = None
_embedding_lock = threading.Lock()
_qdrant_lock = threading.Lock()


def get_embedding_model():
    """Lazy-load embedding model to avoid slow startup on deployment platforms."""
    global _embedding_model
    if _embedding_model is not None:
        return _embedding_model

    with _embedding_lock:
        if _embedding_model is None:
            logger.info("[RAG] Loading embedding model: %s", EMBEDDING_MODEL_NAME)
            _embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

    return _embedding_model


def get_qdrant_client() -> QdrantClient:
    """Lazy-load Qdrant client with deployment-safe timeout settings."""
    global _qdrant_client
    if _qdrant_client is not None:
        return _qdrant_client

    with _qdrant_lock:
        if _qdrant_client is None:
            logger.info("[RAG] Connecting to Qdrant at %s", QDRANT_URL)
            _qdrant_client = QdrantClient(
                url=QDRANT_URL,
                api_key=QDRANT_API_KEY or None,
                timeout=QDRANT_TIMEOUT_SECONDS,
            )

    return _qdrant_client


def embed_text(text: str) -> list[float]:
    """Embed a single text string and return a 1024-dim vector."""
    return get_embedding_model().embed_query(text)
