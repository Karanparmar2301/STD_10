"""
chunker.py — Split documents into AI-readable chunks.
Uses token-aware RecursiveCharacterTextSplitter with production defaults.
"""
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from transformers import AutoTokenizer
from .loader import load_pdfs
from .embeddings import EMBEDDING_MODEL_NAME

_tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL_NAME)


def _token_len(text: str) -> int:
    return len(_tokenizer.encode(text, add_special_tokens=False))


def chunk_documents():
    documents = load_pdfs()

    chunk_size_tokens = int(os.getenv("RAG_CHUNK_SIZE_TOKENS", "500"))
    chunk_overlap_tokens = int(os.getenv("RAG_CHUNK_OVERLAP_TOKENS", "100"))

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size_tokens,
        chunk_overlap=chunk_overlap_tokens,
        length_function=_token_len,
        separators=["\n\n", "\n", ".", " "]
    )

    chunks = [c for c in text_splitter.split_documents(documents) if (c.page_content or "").strip()]
    print(f"Total Chunks Created: {len(chunks)}")
    return chunks


if __name__ == "__main__":
    chunks = chunk_documents()
    print(chunks[0])
