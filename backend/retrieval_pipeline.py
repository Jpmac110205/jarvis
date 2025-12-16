import os
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage

load_dotenv()

persistent_directory = "db/chroma_db"

embedding_model = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=os.getenv("OPENAI_API_KEY")  # fallback if env fails
)

db = Chroma (
    persist_directory=persistent_directory,
    embedding_function=embedding_model,
    collection_metadata={"hnsw:space": "cosine"},
)

query = "Give me controvertial things OpenAi has done in the past years."

#retrieves top 3 most similar documents from vector store
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
    SystemMessage(content = "You are a helpful AI assistant that provides accurate information based on provided documents."),
    HumanMessage(content=combined_input)
]
result = model.invoke(messages)
print("--Generated Answer-- ")
print("Content only:")
print(result.content)