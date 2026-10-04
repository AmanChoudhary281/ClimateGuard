from pathlib import Path

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from sentence_transformers import CrossEncoder


VECTORSTORE_DIR = Path(__file__).parent / "vectorstore"

RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"


def load_vectorstore():

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = FAISS.load_local(
        VECTORSTORE_DIR,
        embeddings,
        allow_dangerous_deserialization=True
    )

    return vectorstore


def rerank(query, documents):

    reranker = CrossEncoder(RERANKER_MODEL)

    pairs = [
        [query, document.page_content]
        for document in documents
    ]

    scores = reranker.predict(pairs)

    ranked_results = sorted(
        zip(documents, scores),
        key=lambda x: x[1],
        reverse=True
    )

    return ranked_results


def search(query, retrieve_k=5, final_k=3):

    vectorstore = load_vectorstore()

    results = vectorstore.similarity_search(
        query,
        k=retrieve_k
    )

    reranked_results = rerank(
        query,
        results
    )

    return reranked_results[:final_k]


if __name__ == "__main__":

    query = input("\nAsk ClimateGuard: ")

    results = search(query)

    print("\nReranked relevant chunks:\n")

    for i, (document, score) in enumerate(
        results,
        start=1
    ):

        print(f"--- Result {i} ---")
        print(f"Rerank Score: {score:.4f}")
        print(f"Source: {document.metadata['source']}")
        print(f"Page: {document.metadata['page']}")
        print(f"Method: {document.metadata['method']}")
        print(f"Chunk ID: {document.metadata['chunk_id']}")
        print()
        print(document.page_content[:1500])
        print()