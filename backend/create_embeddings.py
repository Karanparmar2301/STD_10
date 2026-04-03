from typing import List, Dict, Any
from chunk_documents import chunk_documents
from tqdm import tqdm

try:
    from langchain_huggingface import HuggingFaceEmbeddings
except ImportError:
    from langchain_community.embeddings import HuggingFaceEmbeddings


def create_embeddings() -> List[Dict[str, Any]]:

    chunks = chunk_documents()

    embedding_model = HuggingFaceEmbeddings(
        model_name="BAAI/bge-large-en-v1.5"
    )

    embeddings = []

    for chunk in tqdm(chunks, desc="Generating Embeddings", unit="chunk"):

        vector = embedding_model.embed_query(chunk.page_content)

        embeddings.append({
            "text": chunk.page_content,
            "metadata": chunk.metadata,
            "vector": vector
        })

    print(f"\nTotal Embeddings Created: {len(embeddings)}")

    return embeddings


if __name__ == "__main__":

    embeddings = create_embeddings()

    print("Embedding generation complete")
