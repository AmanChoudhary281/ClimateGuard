from pathlib import Path
from functools import lru_cache

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

VECTORSTORE_DIR = Path(__file__).resolve().parent / "vectorstore"


@lru_cache(maxsize=1)
def load_vectorstore():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
    )

    return FAISS.load_local(
        str(VECTORSTORE_DIR),
        embeddings,
        allow_dangerous_deserialization=True,
    )


def search(query, retrieve_k=5, final_k=3, min_score=None):
    vectorstore = load_vectorstore()

    results = vectorstore.similarity_search_with_score(
        query,
        k=retrieve_k,
    )

    ranked_results = sorted(
        results,
        key=lambda item: float(item[1]),
    )

    selected = ranked_results[:final_k]

    return [
        (document, -float(distance))
        for document, distance in selected
    ]


if __name__ == "__main__":
    query = input("\nAsk ClimateGuard: ")
    results = search(query)

    for i, (document, score) in enumerate(results, start=1):
        print(f"\n--- Result {i} ---")
        print(f"FAISS score (negative distance): {score:.4f}")
        print(f"Source: {document.metadata.get('source', 'Unknown')}")
        print(f"Page: {document.metadata.get('page', 'Unknown')}")
        print(document.page_content[:1500])