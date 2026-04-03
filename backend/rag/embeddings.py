"""
embeddings.py — Shared embedding model (BAAI/bge-large-en-v1.5, 1024-dim).
Loaded once at import time and reused across the pipeline.
"""
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

try:
    from langchain_huggingface import HuggingFaceEmbeddings
except ImportError:
    from langchain_community.embeddings import HuggingFaceEmbeddings

# ── DNS Workaround Patch (Fixes Errno 11001: getaddrinfo failed) ─────────────
import socket
_orig_getaddrinfo = socket.getaddrinfo
def _patched_getaddrinfo(host, *args, **kwargs):
    if host == "b999b3f4-d0c8-4c5c-8396-5b88400f7b82.us-west-1-0.aws.cloud.qdrant.io":
        return _orig_getaddrinfo("52.8.48.156", *args, **kwargs)
    return _orig_getaddrinfo(host, *args, **kwargs)
socket.getaddrinfo = _patched_getaddrinfo
# ─────────────────────────────────────────────────────────────────────────────

# Load env from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)
load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "class10_textbooks"

# Shared instances (loaded once)
embedding_model = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-en-v1.5"
)

qdrant_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY
)


def embed_text(text: str) -> list[float]:
    """Embed a single text string and return a 1024-dim vector."""
    return embedding_model.embed_query(text)
