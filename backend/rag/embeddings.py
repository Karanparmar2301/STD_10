"""
embeddings.py — Shared embedding model and Qdrant client helpers.
Provides configurable failover without hardcoded DNS/IP values.
"""
import os
import socket
import threading
from urllib.parse import urlparse
from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceEmbeddings
from qdrant_client import QdrantClient

# Load env from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)
load_dotenv()

EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-large-en-v1.5")
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_FALLBACK_URL = os.getenv("QDRANT_FALLBACK_URL", "").strip()
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_TIMEOUT_SECONDS = int(float(os.getenv("QDRANT_TIMEOUT_SECONDS", "4")))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "class10_textbooks")


def _apply_optional_dns_override() -> None:
    """
    Optional override for environments where DNS resolution fails.
    Set QDRANT_FORCE_IP to enable this (no hardcoded IPs in code).
    """
    forced_ip = (os.getenv("QDRANT_FORCE_IP") or "").strip()
    if not forced_ip:
        return

    host = (urlparse(QDRANT_URL).hostname or "").strip()
    if not host:
        return

    original_getaddrinfo = socket.getaddrinfo

    def _patched_getaddrinfo(target_host, *args, **kwargs):
        if target_host == host:
            return original_getaddrinfo(forced_ip, *args, **kwargs)
        return original_getaddrinfo(target_host, *args, **kwargs)

    socket.getaddrinfo = _patched_getaddrinfo
    print(f"[Qdrant] DNS override active: {host} -> {forced_ip}")


def get_qdrant_urls() -> list[str]:
    """Primary + optional fallback URLs used for query failover."""
    urls = []
    for value in [QDRANT_URL, QDRANT_FALLBACK_URL, "http://localhost:6333"]:
        url = (value or "").strip()
        if url and url not in urls:
            urls.append(url)
    return urls


_apply_optional_dns_override()

# Shared instances (loaded once)
_embedding_model = None
_embedding_model_lock = threading.Lock()
_qdrant_clients: dict[str, QdrantClient] = {}


def _get_embedding_model() -> HuggingFaceEmbeddings:
    global _embedding_model
    if _embedding_model is not None:
        return _embedding_model

    with _embedding_model_lock:
        if _embedding_model is None:
            _embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

    return _embedding_model


def get_qdrant_client(url: str | None = None) -> QdrantClient:
    """Return a cached Qdrant client for the given URL."""
    target_url = (url or QDRANT_URL).strip() or "http://localhost:6333"
    if target_url not in _qdrant_clients:
        _qdrant_clients[target_url] = QdrantClient(
            url=target_url,
            api_key=QDRANT_API_KEY,
            timeout=QDRANT_TIMEOUT_SECONDS,
            check_compatibility=False,
        )
    return _qdrant_clients[target_url]


# Backward compatibility for existing imports.
qdrant_client = get_qdrant_client()


def embed_text(text: str) -> list[float]:
    """Embed a single text string and return a vector."""
    return _get_embedding_model().embed_query(text)
