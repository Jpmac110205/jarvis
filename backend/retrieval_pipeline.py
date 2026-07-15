import os
import chromadb
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

embedding_model = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

# Chroma Cloud client — replaces local persist_directory
chroma_client = chromadb.CloudClient(
    api_key=os.getenv("CHROMA_API_KEY"),
    tenant=os.getenv("CHROMA_TENANT"),
    database=os.getenv("CHROMA_DATABASE"),
)

db = Chroma(
    client=chroma_client,
    collection_name="prodigy_documents",   # pick one, must match ingestion side
    embedding_function=embedding_model,
    collection_metadata={"hnsw:space": "cosine"},
)


def _run_demo_query():
    query = "Give me controversial things OpenAI has done in the past years."

    retriever = db.as_retriever(search_kwargs={"k": 5})
    relevant_docs = retriever.invoke(query)

    print(f"User Query: {query}")
    print("--Context--")
    for i, doc in enumerate(relevant_docs, 1):
        print(f"Document {i}:\n {doc.page_content}\n")

    combined_input = f"""Based on the following documents, please answer this question: {query}
Documents:
{chr(10).join([f"- {doc.page_content}" for doc in relevant_docs])}
Please provide a clear, helpful answer using only the information from these documents. If you cannot find the answer in the documents, please respond with "I don't know."
"""

    model = ChatOpenAI(
        model="gpt-4o",
        temperature=0,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )
    messages = [
        SystemMessage(content="You are a helpful AI assistant that provides accurate information based on provided documents."),
        HumanMessage(content=combined_input)
    ]
    result = model.invoke(messages)

    print("--Generated Answer--")
    print("Content only:")
    print(result.content)


if __name__ == "__main__":
    _run_demo_query()