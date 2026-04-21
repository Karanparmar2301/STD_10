"""
loader.py — Load textbooks from backend/data and backend/uploads.
Uses recursive PDF discovery and page-level fault tolerance.
"""
import os
from langchain_community.document_loaders import PyPDFLoader
from tqdm import tqdm

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
DATA_PATH = os.path.join(BASE_DIR, "data")
UPLOADS_PATH = os.path.join(BASE_DIR, "uploads")


def _discover_pdf_paths() -> list[str]:
    roots = [DATA_PATH, UPLOADS_PATH]
    pdf_paths: list[str] = []
    for root in roots:
        if not os.path.isdir(root):
            continue
        for dirpath, _, filenames in os.walk(root):
            for name in filenames:
                if name.lower().endswith(".pdf"):
                    pdf_paths.append(os.path.join(dirpath, name))
    # Stable order keeps ingestion deterministic.
    return sorted(pdf_paths)


def load_pdfs():
    documents = []
    pdf_paths = _discover_pdf_paths()

    for file_path in tqdm(pdf_paths, desc="Loading PDFs", unit="file"):
        file_name = os.path.basename(file_path)
        try:
            loader = PyPDFLoader(file_path)
            docs = []
            for doc in loader.lazy_load():
                try:
                    if (doc.page_content or "").strip():
                        docs.append(doc)
                except Exception as page_err:
                    tqdm.write(f"  [SKIP] Skipped a page in {file_name}: {page_err}")
            documents.extend(docs)
            tqdm.write(f"  [OK] Loaded: {file_name} ({len(docs)} pages)")
        except Exception as e:
            tqdm.write(f"  [ERR] Error loading {file_name}: {e}")

    return documents


if __name__ == "__main__":
    docs = load_pdfs()
    print(f"\nTotal Pages Loaded: {len(docs)}")
