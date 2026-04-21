"""
local_retriever.py — Local textbook retrieval fallback when Qdrant is unavailable.
Builds an in-memory lexical index from PDFs loaded by loader.py.
"""

import os
import re
import threading
import pickle
import hashlib
from collections import Counter
from typing import Dict, List

from langchain_community.document_loaders import PyPDFLoader
from .loader import DATA_PATH, UPLOADS_PATH, _discover_pdf_paths

_INDEX_LOCK = threading.Lock()
_INDEX: List[Dict] | None = None
_CACHE_FILE = os.path.join(os.path.dirname(__file__), "local_index_cache.pkl")

_TOKEN_RE = re.compile(r"[A-Za-z0-9\u0900-\u097F\u0A80-\u0AFF]+")
_STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "what", "when", "where", "which", "who",
    "why", "how", "are", "was", "were", "can", "will", "shall", "into", "about", "have", "has",
    "had", "your", "their", "his", "her", "our", "you", "they", "them", "its", "also", "then",
    "than", "not", "but", "all", "any", "may", "use", "using", "used", "class", "chapter", "question",
    "summary", "lesson", "notes", "explain", "describe", "detail", "details", "definition", "topic", "write",
    "\u0915\u093e", "\u0915\u0947", "\u0915\u0940", "\u0939\u0948", "\u0939\u0948\u0902", "\u0925\u093e", "\u0925\u0940", "\u0925\u0947",
    "\u0914\u0930", "\u092f\u0939", "\u0935\u0939", "\u090f\u0915", "\u090f\u0935\u0902", "\u0915\u094d\u092f\u093e", "\u0915\u0948\u0938\u0947", "\u0915\u094d\u092f\u094b\u0902",
    "\u0915\u094c\u0928", "\u0915\u094c\u0928\u0938\u093e", "\u0915\u093f\u0938", "\u0915\u093f\u0938\u0947", "\u092e\u0947\u0902", "\u0938\u0947", "\u092a\u0930", "\u0915\u094b",
    "\u0915\u0930\u0947\u0902", "\u0915\u0930\u0947", "\u0915\u0930\u094b", "\u0915\u0930\u0928\u093e", "\u0915\u093f\u092f\u093e", "\u0917\u092f\u093e", "\u0917\u0908", "\u0917\u090f",
    "\u092a\u093e\u0920", "\u0905\u0927\u094d\u092f\u093e\u092f", "\u0938\u093e\u0930\u093e\u0902\u0936", "\u092c\u0924\u093e\u0907\u090f", "\u0935\u093f\u0935\u0930\u0923",
}


def _tokenize(text: str) -> List[str]:
    return [t.lower() for t in _TOKEN_RE.findall(text or "")]


def _is_meaningful_token(token: str) -> bool:
    return len(token) > 1 and (token not in _STOPWORDS) and (not token.isdigit())


def _split_text(text: str, chunk_size: int = 900, overlap: int = 120) -> List[str]:
    cleaned = re.sub(r"\s+", " ", text or "").strip()
    if not cleaned:
        return []
    if len(cleaned) <= chunk_size:
        return [cleaned]

    chunks: List[str] = []
    n = len(cleaned)
    start = 0

    while start < n:
        end = min(n, start + chunk_size)
        if end < n:
            probe_start = start + int(chunk_size * 0.55)
            breakpoints = [
                cleaned.rfind(". ", probe_start, end),
                cleaned.rfind("? ", probe_start, end),
                cleaned.rfind("! ", probe_start, end),
                cleaned.rfind("।", probe_start, end),
                cleaned.rfind("\n", probe_start, end),
            ]
            best_cut = max(breakpoints)
            if best_cut > start:
                end = best_cut + 1

        piece = cleaned[start:end].strip()
        if piece:
            chunks.append(piece)

        if end >= n:
            break
        next_start = max(0, end - overlap)
        start = next_start if next_start > start else end

    return chunks


def _candidate_pdf_paths() -> List[str]:
    include_uploads = os.getenv("LOCAL_RAG_INCLUDE_UPLOADS", "0").lower() in {"1", "true", "yes"}
    max_pdfs = int(os.getenv("LOCAL_RAG_MAX_PDFS", "30"))

    data_root = os.path.abspath(DATA_PATH)
    uploads_root = os.path.abspath(UPLOADS_PATH)

    selected: List[str] = []
    for path in _discover_pdf_paths():
        abspath = os.path.abspath(path)
        in_uploads = abspath.startswith(uploads_root + os.sep)
        in_data = abspath.startswith(data_root + os.sep)

        if in_uploads and not include_uploads:
            continue
        if not (in_data or in_uploads):
            continue

        selected.append(abspath)
        if len(selected) >= max_pdfs:
            break

    return selected


def _build_signature(pdf_paths: List[str]) -> str:
    """Build a stable signature for cache invalidation."""
    parts = ["v2"]
    for path in pdf_paths:
        try:
            st = os.stat(path)
            parts.append(f"{path}|{st.st_size}|{st.st_mtime_ns}")
        except Exception:
            parts.append(f"{path}|missing")
    digest = hashlib.sha1(";".join(parts).encode("utf-8", errors="ignore")).hexdigest()
    return digest


def _load_cache(signature: str) -> List[Dict] | None:
    try:
        if not os.path.isfile(_CACHE_FILE):
            return None
        with open(_CACHE_FILE, "rb") as f:
            payload = pickle.load(f)
        if not isinstance(payload, dict):
            return None
        if payload.get("signature") != signature:
            return None
        entries = payload.get("entries")
        if not isinstance(entries, list):
            return None
        print(f"[LocalRetriever] Loaded {len(entries)} cached fallback chunks")
        return entries
    except Exception:
        return None


def _save_cache(signature: str, entries: List[Dict]) -> None:
    try:
        payload = {
            "signature": signature,
            "entries": entries,
        }
        with open(_CACHE_FILE, "wb") as f:
            pickle.dump(payload, f, protocol=pickle.HIGHEST_PROTOCOL)
    except Exception:
        # Cache write failures should never break retrieval.
        return


def _build_local_index() -> List[Dict]:
    entries: List[Dict] = []
    pdf_paths = _candidate_pdf_paths()
    signature = _build_signature(pdf_paths)

    cached_entries = _load_cache(signature)
    if cached_entries is not None:
        return cached_entries

    for pdf_path in pdf_paths:
        try:
            loader = PyPDFLoader(pdf_path)
            source = os.path.basename(pdf_path)

            for doc in loader.lazy_load():
                try:
                    raw_text = (doc.page_content or "").strip()
                    if not raw_text:
                        continue

                    metadata = doc.metadata or {}
                    page = int(metadata.get("page", 0)) + 1

                    for chunk_text in _split_text(raw_text):
                        tokens = [t for t in _tokenize(chunk_text) if _is_meaningful_token(t)]
                        if not tokens:
                            continue

                        token_counts = Counter(tokens)
                        entries.append({
                            "text": chunk_text,
                            "source": source,
                            "page": page,
                            "token_counts": token_counts,
                            "token_set": set(token_counts.keys()),
                        })
                except Exception:
                    # Skip problematic pages and continue indexing.
                    continue
        except Exception as e:
            print(f"[LocalRetriever] Skipping {os.path.basename(pdf_path)}: {e}")
            continue

    print(f"[LocalRetriever] Indexed {len(entries)} fallback chunks from {len(pdf_paths)} PDFs")
    _save_cache(signature, entries)
    return entries


def _ensure_index() -> List[Dict]:
    global _INDEX
    if _INDEX is not None:
        return _INDEX

    with _INDEX_LOCK:
        if _INDEX is None:
            _INDEX = _build_local_index()

    return _INDEX


def local_keyword_search(question: str, limit: int = 8) -> List[Dict]:
    query_terms = [
        t for t in _tokenize(question)
        if _is_meaningful_token(t)
    ]
    if not query_terms:
        return []

    query_set = set(query_terms)
    entries = _ensure_index()
    if not entries:
        return []

    scored = []
    for item in entries:
        overlap = len(query_set & item["token_set"])
        if overlap == 0:
            continue

        freq = sum(item["token_counts"].get(t, 0) for t in query_set)
        source_bonus = 0.4 if any(t in item["source"].lower() for t in query_set) else 0.0
        score = (overlap * 2.0) + (freq * 0.35) + source_bonus
        scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)

    docs: List[Dict] = []
    for score, item in scored[:limit]:
        docs.append({
            "text": item["text"],
            "source": item["source"],
            "page": item["page"],
            "score": round(float(score), 4),
            "method": "local",
        })

    return docs
