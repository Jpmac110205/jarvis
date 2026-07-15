import os
import chromadb
from langchain_community.document_loaders import TextLoader
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from dotenv import load_dotenv
load_dotenv()

# Chroma Cloud client — shared connection config
chroma_client = chromadb.CloudClient(
    api_key=os.getenv("CHROMA_API_KEY"),
    tenant=os.getenv("CHROMA_TENANT"),
    database=os.getenv("CHROMA_DATABASE"),
)


def load_document(file_path):
    print(f"Loading document: {file_path}")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"The file {file_path} does not exist.")

    if file_path.endswith(".pdf"):
        loader = PyPDFLoader(file_path)
    elif file_path.endswith(".txt"):
        loader = TextLoader(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_path}. Expected .pdf or .txt")

    documents = loader.load()
    print(f"[Loader] Loaded {len(documents)} page(s) from {file_path}")
    return documents


def get_chunk_params(total_chars: int, doc_type: str) -> tuple[int, int]:
    if total_chars < 5_000:
        chunk_size = 300
        chunk_overlap = 60
    elif total_chars < 20_000:
        chunk_size = 600
        chunk_overlap = 120
    elif total_chars < 60_000:
        chunk_size = 1_000
        chunk_overlap = 200
    elif total_chars < 150_000:
        chunk_size = 2_000
        chunk_overlap = 400
    else:
        chunk_size = 4_000
        chunk_overlap = 600

    if doc_type == "dense":
        chunk_size = int(chunk_size * 0.75)
        chunk_overlap = int(chunk_overlap * 0.75)
    elif doc_type == "notes":
        chunk_size = int(chunk_size * 1.15)
        chunk_overlap = int(chunk_overlap * 1.15)

    print(f"[Chunker] doc_type={doc_type} | chars={total_chars:,} → chunk_size={chunk_size}, overlap={chunk_overlap}")
    return chunk_size, chunk_overlap


def split_documents(documents, doc_type: str = "default", filename: str = "unknown", user_id: str = None):
    total_chars = sum(len(doc.page_content) for doc in documents)
    chunk_size, chunk_overlap = get_chunk_params(total_chars, doc_type)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )

    chunks = splitter.split_documents(documents)

    for i, chunk in enumerate(chunks):
        chunk.metadata.update({
            "source":        filename,
            "chunk_index":   i,
            "total_chunks":  len(chunks),
            "doc_type":      doc_type,
            "chunk_size":    chunk_size,
            "chunk_overlap": chunk_overlap,
            "total_chars":   total_chars,
            "user_id":       user_id,
        })

    print(f"[Chunker] {len(documents)} doc(s) → {len(chunks)} chunks for user_id={user_id}")
    return chunks


def create_vector_store(chunks):
    print("Creating vector store and storing in Chroma Cloud...")
    embedding_model = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_model,
        client=chroma_client,
        collection_name="prodigy_documents",   # must match retrieval_pipeline.py
        collection_metadata={"hnsw:space": "cosine"},
    )
    print(f"[VectorStore] {len(chunks)} chunks persisted to Chroma Cloud.")
    return vectorstore


def ingest_file(file_path, doc_type: str = "default", user_id: str = None):
    filename = os.path.basename(file_path)
    documents = load_document(file_path)
    chunks = split_documents(documents, doc_type=doc_type, filename=filename, user_id=user_id)
    vectorstore = create_vector_store(chunks)
    return vectorstore


if __name__ == "__main__":
    import sys
    if len(sys.argv) not in (2, 3):
        print("Usage: python ingestion_pipeline.py <path_to_file> [doc_type]")
        print("       doc_type: default | dense | notes")
        sys.exit(1)

    file_path = sys.argv[1]
    doc_type = sys.argv[2] if len(sys.argv) == 3 else "default"
    ingest_file(file_path, doc_type=doc_type)