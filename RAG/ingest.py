from pathlib import Path

import pymupdf
import pytesseract
from PIL import Image

from pypdf import PdfReader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS


DATA_DIR = Path(__file__).parent / "data"
VECTORSTORE_DIR = Path(__file__).parent / "vectorstore"

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def extract_documents(file_path):
    reader = PdfReader(file_path)
    documents = []

    pdf = pymupdf.open(file_path)

    for page_number, page in enumerate(reader.pages, start=1):

        text = page.extract_text()

        if text and text.strip():
            method = "text"

        else:
            pdf_page = pdf[page_number - 1]

            pix = pdf_page.get_pixmap(
                matrix=pymupdf.Matrix(2, 2)
            )

            image = Image.frombytes(
                "RGB",
                [pix.width, pix.height],
                pix.samples
            )

            text = pytesseract.image_to_string(image)
            method = "ocr"

        if text and text.strip():

            documents.append(
                Document(
                    page_content=text.strip(),
                    metadata={
                        "source": file_path.name,
                        "page": page_number,
                        "method": method
                    }
                )
            )

    pdf.close()

    return documents


def create_chunks(documents):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    chunks = splitter.split_documents(documents)

    for index, chunk in enumerate(chunks):

        source = chunk.metadata["source"]

        chunk.metadata["chunk_id"] = (
            f"{Path(source).stem}_{index}"
        )

    return chunks


def create_vectorstore(chunks):

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = FAISS.from_documents(
        chunks,
        embeddings
    )

    vectorstore.save_local(VECTORSTORE_DIR)

    return vectorstore


if __name__ == "__main__":

    print("Scanning PDF files...")

    pdf_files = list(DATA_DIR.glob("*.pdf"))

    if not pdf_files:
        print("No PDF files found.")
        exit()

    print(f"PDF files found: {len(pdf_files)}")

    all_documents = []

    for pdf_file in pdf_files:

        print(f"\nProcessing: {pdf_file.name}")

        documents = extract_documents(pdf_file)

        print(
            f"Pages extracted: {len(documents)}"
        )

        all_documents.extend(documents)

    print(
        f"\nTotal pages extracted: {len(all_documents)}"
    )

    print("\nCreating chunks...")

    chunks = create_chunks(all_documents)

    print(
        f"Total chunks created: {len(chunks)}"
    )

    print("\nCreating embeddings and FAISS index...")

    create_vectorstore(chunks)

    print("\nVectorstore created successfully.")
    print(f"Saved at: {VECTORSTORE_DIR}")