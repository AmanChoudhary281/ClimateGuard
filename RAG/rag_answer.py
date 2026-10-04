from langchain_google_genai.chat_models import GoogleRateLimitError
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

from retriever import search


load_dotenv(r"D:\Project\ClimateGuard\Backend\.env")


llm = ChatGoogleGenerativeAI(
    model="gemini-3.8-flash",
    temperature=0
)


def generate_answer(query):

    results = search(
        query,
        retrieve_k=5,
        final_k=3
    )

    context_parts = []

    for document, score in results:

        source = document.metadata["source"]
        page = document.metadata["page"]

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
- If the context does not contain enough information, say that the available sources do not provide enough information.
- Give a clear and practical answer.
- Mention important safety actions first.
- At the end, provide the source document name and page number used.

Context:

{context}

User Question:

{query}
"""

    try:
        response = llm.invoke(prompt)

    except GoogleRateLimitError:
        return {
            "answer": "AI service quota is temporarily unavailable. Please try again later.",
            "error": "AI_QUOTA_EXCEEDED"
        }, results

    if isinstance(response.content, list):
        answer = "".join(
            item.get("text", "")
            for item in response.content
            if isinstance(item, dict)
        )
    else:
        answer = response.content

    return answer, results


if __name__ == "__main__":

    query = input("\nAsk ClimateGuard: ")

    answer, results = generate_answer(query)

    print("\nClimateGuard Answer:\n")
    print(answer)

    print("\nRetrieved Sources:\n")

    for document, score in results:

        print(
            f"- {document.metadata['source']} "
            f"(Page {document.metadata['page']})"
        )