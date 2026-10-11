
from pathlib import Path
from functools import lru_cache

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from sentence_transformers import CrossEncoder


VECTORSTORE_DIR = Path(__file__).resolve().parent / "vectorstore"

RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"


@lru_cache(maxsize=1)
def load_vectorstore():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"}
    )

    vectorstore = FAISS.load_local(
        VECTORSTORE_DIR,
        embeddings,
        allow_dangerous_deserialization=True
    )

    return vectorstore


@lru_cache(maxsize=1)
def load_reranker():
    return CrossEncoder(
        RERANKER_MODEL,
        device="cpu"
    )


def rerank(query, documents):
    reranker = load_reranker()

    pairs = [
        [query, document.page_content]
        for document in documents
    ]

    scores = reranker.predict(pairs)

    ranked_results = sorted(
        zip(documents, scores),
        key=lambda x: float(x[1]),
        reverse=True
    )

    return ranked_results


def search(query, retrieve_k=5, final_k=3, min_score=-1.0):
    vectorstore = load_vectorstore()

    results = vectorstore.similarity_search(
        query,
        k=retrieve_k
    )

    reranked_results = rerank(query, results)

    filtered_results = [
        (document, float(score))
        for document, score in reranked_results
        if float(score) >= min_score
    ]

    return filtered_results[:final_k]


if __name__ == "__main__":
    query = input("\nAsk ClimateGuard: ")
    results = search(query)

    for i, (document, score) in enumerate(results, start=1):
        print(f"\n--- Result {i} ---")
        print(f"Rerank Score: {score:.4f}")
        print(f"Source: {document.metadata['source']}")
        print(f"Page: {document.metadata['page']}")
        print(document.page_content[:1500])
