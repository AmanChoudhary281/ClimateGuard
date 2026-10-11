
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai.chat_models import GoogleRateLimitError

from retriever import search

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash",
    temperature=0,
    request_timeout=20,
    max_retries=0,
)


def generate_answer(query):
    results = []

    try:
        retrieved = search(
            query,
            retrieve_k=5,
            final_k=3,
        )

        if retrieved is not None:
            results = retrieved

    except Exception as e:
        print(f"RAG retrieval error: {type(e).__name__}: {e}")
        return {
            "answer": (
                "ClimateGuard could not retrieve its safety "
                "guidelines right now. Please try again later."
            ),
            "error": "RETRIEVAL_FAILED",
        }, results

    if not results:
        return {
            "answer": (
                "I could not find relevant information in the "
                "available ClimateGuard sources. Please try "
                "rephrasing your question."
            ),
            "error": "NO_RELEVANT_SOURCES",
        }, results

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

Answer the user's question using ONLY the provided context.

Rules:
- Do not invent facts.
- If the context is insufficient, say so clearly.
- Give clear and practical advice.
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
        print(f"Gemini rate limit: {e}")

        return {
            "answer": (
                "AI service quota is temporarily unavailable. "
                "Please try again later."
            ),
            "error": "AI_QUOTA_EXCEEDED",
        }, results

    except Exception as e:
        print(f"Gemini error: {type(e).__name__}: {e}")

        fallback_answer = (
            "The AI service is temporarily unavailable. "
            "Here is information retrieved from the available "
            "ClimateGuard sources:\n\n"
            + "\n\n".join(
                document.page_content.strip()
                for document, score in results
            )
            + "\n\nSources:\n"
            + "\n".join(
                f"- {document.metadata.get('source', 'Unknown source')} "
                f"— Page {document.metadata.get('page', 'Unknown')}"
                for document, score in results
            )
        )

        return {
            "answer": fallback_answer,
            "error": "AI_SERVICE_UNAVAILABLE",
        }, results


if __name__ == "__main__":
    query = input("\nAsk ClimateGuard: ")

    answer, results = generate_answer(query)

    print("\nClimateGuard Answer:\n")

    if isinstance(answer, dict):
        print(answer.get("answer", answer))
    else:
        print(answer)

    print("\nRetrieved Sources:\n")

    for document, score in results:
        print(
            f"- {document.metadata.get('source', 'Unknown source')} "
            f"(Page {document.metadata.get('page', 'Unknown')})"
        )
