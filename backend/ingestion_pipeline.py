import os
from langchain_community.document_loaders import TextLoader, DirectoryLoader
from langchain_text_splitters import CharacterTextSplitter 
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_chroma import Chroma
from dotenv import load_dotenv

load_dotenv()

def load_documents(docs_path = "docs"):
    print(f"Loading documents from {docs_path}")
    if not os.path.exists(docs_path):
        raise FileNotFoundError(f"The specified path {docs_path} does not exist.")
    
    loader = DirectoryLoader(
        path = docs_path,
        glob = "*.txt",
        loader_cls = TextLoader,
    )
    
    documents = loader.load()
    
    if len(documents) == 0:
        raise ValueError(f"No documents found in the specified path {docs_path}.")
    for i, doc in enumerate(documents[:2]):
        print(f"\nDocument {i+1}:")
        print(f" Source: {doc.metadata['source']}")
        print(f" Context Length: {len(doc.page_content)} characters")
        print(f" Content Preview: {doc.page_content[:200]}...")
        print(f" metadata: {doc.metadata}")
    return documents


def split_documents(documents, chunk_size=800, chunk_overlap=0):
    print("Splitting documents into chunks...")
    text_splitter = CharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    chunks = text_splitter.split_documents(documents)
    if chunks:
        for i, chunk in enumerate(chunks[:2]):
            print(f"\nChunk {i+1}:")
            print(f" Context Length: {len(chunk.page_content)} characters")
            print(f" Content Preview: {chunk.page_content[:200]}...")
            print(f" metadata: {chunk.metadata}")
        
        if len(chunks) > 5:
            print(f"\n... (and {len(chunks) - 2} more chunks)")
    print(f"Total chunks created: {len(chunks)}")
    
    return chunks

def create_vector_store(chunks, persist_directory="db/chroma_db"):
    print("Creating vector store and storing in Chroma DB...")

    embedding_model = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=os.getenv("OPENAI_API_KEY")  # fallback if env fails
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


def main(): 
    print("Main function")
    #load files
    documents = load_documents(docs_path="docs")
    #chunk files
    chunks = split_documents(documents, chunk_size=800, chunk_overlap=0)
    #embedding and storing in vector db
    vectorstore = create_vector_store(chunks)
    
    
if __name__ == "__main__":
    main()