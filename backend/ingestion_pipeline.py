# Ingest a single document uploaded by the user
# Extract text, and embed it into the vector database
import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_chroma import Chroma
from dotenv import load_dotenv

load_dotenv()

def load_document(file_path):
    print(f"Loading document: {file_path}")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"The file {file_path} does not exist.")
    if not file_path.endswith(".txt"):
        raise ValueError(f"Expected a .txt file, got: {file_path}")

    loader = TextLoader(file_path)
    documents = loader.load()

    doc = documents[0]
    print(f"\nDocument loaded:")
    print(f"  Source: {doc.metadata['source']}")
    print(f"  Content Length: {len(doc.page_content)} characters")
    print(f"  Content Preview: {doc.page_content[:200]}...")
    print(f"  Metadata: {doc.metadata}")

    return documents

def split_documents(documents, chunk_size=800, chunk_overlap=0):
    print("Splitting document into chunks...")
    text_splitter = CharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    chunks = text_splitter.split_documents(documents)

    if chunks:
        for i, chunk in enumerate(chunks[:2]):
            print(f"\nChunk {i+1}:")
            print(f"  Content Length: {len(chunk.page_content)} characters")
            print(f"  Content Preview: {chunk.page_content[:200]}...")
            print(f"  Metadata: {chunk.metadata}")
        if len(chunks) > 2:
            print(f"\n... (and {len(chunks) - 2} more chunks)")

    print(f"Total chunks created: {len(chunks)}")
    return chunks

def create_vector_store(chunks, persist_directory="db/chroma_db"):
    print("Creating vector store and storing in Chroma DB...")
    embedding_model = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

    print("--Creating vector store--")
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_model,
        persist_directory=persist_directory,
        collection_metadata={"hnsw:space": "cosine"},
    )
    print("--Finished creating vector store--")
    print(f"Vector store persisted at: {persist_directory}")
    return vectorstore

def ingest_file(file_path):
    documents = load_document(file_path)
    chunks = split_documents(documents, chunk_size=800, chunk_overlap=0)
    vectorstore = create_vector_store(chunks)
    return vectorstore

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python ingest.py <path_to_file>")
        sys.exit(1)

    file_path = sys.argv[1]
    ingest_file(file_path)