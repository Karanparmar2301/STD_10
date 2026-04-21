"""
retriever.py — Hybrid search: Vector (semantic) + Keyword (exact match).
Combines Qdrant vector search with payload keyword filtering for better accuracy.
Also supports multi-query expansion for unclear questions.
"""
import os
import re
import time
from .embeddings import embed_text, get_qdrant_client, get_qdrant_urls, COLLECTION_NAME

_qdrant_health_cache = {
    "ok": None,
    "checked_at": 0.0,
}


def _is_qdrant_available(cache_ttl_sec: int = 20) -> bool:
    now = time.time()
    cached_ok = _qdrant_health_cache["ok"]
    checked_at = _qdrant_health_cache["checked_at"]
    if cached_ok is not None and (now - checked_at) < cache_ttl_sec:
        return bool(cached_ok)

    for url in get_qdrant_urls():
        client = get_qdrant_client(url)
        try:
            client.get_collections()
            _qdrant_health_cache["ok"] = True
            _qdrant_health_cache["checked_at"] = now
            return True
        except Exception:
            continue

    _qdrant_health_cache["ok"] = False
    _qdrant_health_cache["checked_at"] = now
    return False


def _query_points_with_failover(query_vector, limit: int):
    last_error = None
    for url in get_qdrant_urls():
        client = get_qdrant_client(url)
        for attempt in range(2):
            try:
                return client.query_points(
                    collection_name=COLLECTION_NAME,
                    query=query_vector,
                    limit=limit,
                )
            except Exception as e:
                last_error = e
                if attempt == 0:
                    continue
                print(f"[Retriever] query_points failed on {url}: {e}")
    raise last_error if last_error else RuntimeError("Qdrant query failed")


def _scroll_with_failover(scroll_filter, limit: int):
    last_error = None
    for url in get_qdrant_urls():
        client = get_qdrant_client(url)
        for attempt in range(2):
            try:
                return client.scroll(
                    collection_name=COLLECTION_NAME,
                    scroll_filter=scroll_filter,
                    limit=limit,
                    with_payload=True,
                    with_vectors=False,
                )
            except Exception as e:
                last_error = e
                if attempt == 0:
                    continue
                print(f"[Retriever] scroll failed on {url}: {e}")
    raise last_error if last_error else RuntimeError("Qdrant scroll failed")


def _generate_sub_queries(question: str) -> list[str]:
    """
    Generate 2–3 alternative search queries from the student's question.
    Uses simple rule-based expansion (no extra LLM call needed).
    """
    q = question.strip()
    queries = [q]

    # Remove question marks and common filler words for a cleaner search query
    cleaned = re.sub(r'[?!.]', '', q).strip()
    cleaned = re.sub(r'\b(what is|what are|explain|describe|tell me about|how does|why does)\b',
                     '', cleaned, flags=re.IGNORECASE).strip()

    if cleaned and cleaned.lower() != q.lower():
        queries.append(cleaned)

    # Add "definition of X" variant for short queries
    words = cleaned.split()
    if 1 <= len(words) <= 4:
        queries.append(f"definition of {cleaned}")
        queries.append(f"{cleaned} class 10")

    return queries[:4]  # max 4 sub-queries


def vector_search(question: str, limit: int = 6) -> list[dict]:
    """Semantic vector search in Qdrant."""
    if not _is_qdrant_available():
        return []

    try:
        query_vector = embed_text(question)
        results = _query_points_with_failover(query_vector, limit=limit)
    except Exception as e:
        # Keep chat alive even when Qdrant URL/collection is misconfigured.
        print(f"[Retriever] vector_search failed: {e}")
        return []

    documents = []
    for result in getattr(results, "points", []) or []:
        payload = result.payload or {}
        text = payload.get("text")
        if not text:
            continue
        documents.append({
            "text": text,
            "source": payload.get("source", "Unknown source"),
            "page": payload.get("page", "N/A"),
            "score": result.score,
            "method": "vector"
        })
    return documents


def keyword_search(question: str, limit: int = 4) -> list[dict]:
    """
    Keyword-based search using Qdrant scroll + payload filtering.
    Searches for exact keyword matches in stored chunk text.
    """
    # Extract meaningful keywords (3+ chars, no stopwords)
    stopwords = {'the', 'is', 'are', 'was', 'were', 'what', 'how', 'why', 'when',
                 'where', 'which', 'who', 'does', 'did', 'can', 'will', 'shall',
                 'and', 'but', 'for', 'with', 'from', 'this', 'that', 'about',
                 'explain', 'describe', 'tell', 'give', 'class'}
    words = re.findall(r'\b[a-zA-Z]{3,}\b', question.lower())
    keywords = [w for w in words if w not in stopwords]

    if not keywords:
        return []

    if not _is_qdrant_available():
        return []

    # Use Qdrant scroll with text matching for each keyword
    documents = []
    seen_texts = set()

    for kw in keywords[:3]:  # max 3 keywords
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchText
            results = _scroll_with_failover(
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="text",
                            match=MatchText(text=kw)
                        )
                    ]
                ),
                limit=limit,
            )

            for point in results[0]:  # scroll returns (points, next_offset)
                payload = point.payload or {}
                text = payload.get("text")
                if not text:
                    continue
                text_snippet = text[:200]
                if text_snippet not in seen_texts:
                    seen_texts.add(text_snippet)
                    documents.append({
                        "text": text,
                        "source": payload.get("source", "Unknown source"),
                        "page": payload.get("page", "N/A"),
                        "score": 0.5,  # no vector score for keyword matches
                        "method": "keyword"
                    })
        except Exception:
            continue

    return documents[:limit]


def hybrid_search(question: str, vector_k: int = 8, keyword_k: int = 5) -> list[dict]:
    """
    Combine vector search + keyword search results.
    De-duplicates by text content and merges scores.
    """
    # Multi-query expansion
    sub_queries = _generate_sub_queries(question)

    all_docs = []
    seen_texts = set()

    # Vector search across all sub-queries
    for sq in sub_queries:
        for doc in vector_search(sq, limit=vector_k):
            snippet = doc["text"][:200]
            if snippet not in seen_texts:
                seen_texts.add(snippet)
                all_docs.append(doc)

    # Keyword search on original question
    for doc in keyword_search(question, limit=keyword_k):
        snippet = doc["text"][:200]
        if snippet not in seen_texts:
            seen_texts.add(snippet)
            all_docs.append(doc)

    # Local fallback retrieval when Qdrant is unavailable or returns no hits.
    local_fallback_enabled = os.getenv("LOCAL_RAG_FALLBACK_ENABLED", "1").lower() not in {"0", "false", "no"}
    if not all_docs and local_fallback_enabled:
        try:
            from .local_retriever import local_keyword_search

            fallback_docs = local_keyword_search(question, limit=max(vector_k, keyword_k, 8))
            for doc in fallback_docs:
                snippet = doc["text"][:200]
                if snippet not in seen_texts:
                    seen_texts.add(snippet)
                    all_docs.append(doc)
        except Exception as e:
            print(f"[Retriever] local fallback failed: {e}")

    # Sort by score descending
    all_docs.sort(key=lambda d: d["score"], reverse=True)

    return all_docs[:10]  # return top 10 for reranking
