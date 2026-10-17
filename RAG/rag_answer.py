from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai.chat_models import GoogleRateLimitError

from retriever import search

from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / "Backend" / ".env")

llm = ChatGoogleGenerativeAI(
    model="gemini-3.8-flash",
    temperature=0,
    request_timeout=20,
    max_retries=0,
)


def make_fallback_answer(results):
    if not results:
        return (
            "ClimateGuard could not retrieve safety guidance "
            "right now. Please try again later."
        )

    parts = []

    for document, score in results:
        source = document.metadata.get("source", "Unknown source")
        page = document.metadata.get("page", "Unknown")

        parts.append(
            f"{document.page_content.strip()}\n"
            f"Source: {source}, page {page}"
        )

    return (
        "The AI service is temporarily unavailable. "
        "Here is the relevant information retrieved from "
        "ClimateGuard's available sources:\n\n"
        + "\n\n---\n\n".join(parts)
    )


def generate_answer(query):
    try:
        results = search(
            query,
            retrieve_k=5,
            final_k=3,
        )
    except Exception as e:
        print(f"RAG retrieval error: {type(e).__name__}: {e}", flush=True)
        return (
            "ClimateGuard could not retrieve its safety guidelines "
            "right now. Please try again later."
        ), []

    if not results:
        return (
            "I could not find relevant information in the available "
            "ClimateGuard sources. Please try rephrasing your question."
        ), []

    context_parts = []

    for document, score in results:
        source = document.metadata.get("source", "Unknown source")
        page = document.metadata.get("page", "Unknown page")

        context_parts.append(
            f"Source: {source}\n"
            f"Page: {page}\n"
            f"Content:\n{document.page_content}"
        )

    context = "\n\n---\n\n".join(context_parts)

    prompt = f"""
You are the ClimateGuard AI Assistant.

Answer the user's question using only the provided context.

Rules:
- Do not invent facts.
- If the context is insufficient, say so clearly.
- Give clear, practical safety advice.
- Mention important safety actions first.
- At the end, mention the source document and page number.

Context:
{context}

User Question:
{query}
"""

    try:
        response = llm.invoke(prompt)
        content = response.content

        if isinstance(content, str):
            answer = content
        elif isinstance(content, list):
            answer = "\n".join(
                item.get("text", "")
                for item in content
                if isinstance(item, dict)
            )
        else:
            answer = str(content)

        if not answer.strip():
            raise ValueError("Gemini returned an empty response")

        return answer, results

    except GoogleRateLimitError as e:
        print(f"Gemini rate limit: {e}", flush=True)
        return (
            "AI service quota is temporarily unavailable. "
            "Please try again later."
        ), results

    except Exception as e:
        print(f"Gemini error: {type(e).__name__}: {e}", flush=True)
        return make_fallback_answer(results), results


if __name__ == "__main__":
    query = input("\nAsk ClimateGuard: ")
    answer, results = generate_answer(query)

    print("\nClimateGuard Answer:\n")
    print(answer)

    print("\nRetrieved Sources:\n")
    for document, score in results:
        print(
            f"- {document.metadata.get('source', 'Unknown source')} "
            f"(Page {document.metadata.get('page', 'Unknown')})"
        )