from fastapi import FastAPI, File, UploadFile, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware 
from io import BytesIO
from PIL import Image
import base64
import os
from dotenv import load_dotenv

from fastapi.params import Form
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from fastapi.responses import RedirectResponse
import requests
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from dotenv import load_dotenv




# ==================== SETUP ====================
# Load .env file from the backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, '.env'))
app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== GLOBAL STATE ====================
current_results = {
    "chat_history": [],  # Will store conversation history
}

def create_system_message():
    """Generate a dynamic system message based on prediction results"""
    return SystemMessage(
        content=(
            f"You are Prodigy, a personal AI assistant built with RAG. You have access to the user's personal documents (course notes, papers, project docs), complete conversational history, task list, calendar, and web search capabilities."
            f"Always cite sources when using personal documents. Format citations as 'According to [document name]...' or 'From your [course notes/paper]...'. When synthesizing multiple sources, cite each one explicitly. Never fabricate details about personal documents."
            f"When retrieval quality is low, say 'I don't have enough relevant context for this.' If sources conflict, acknowledge it: 'Your notes suggest X, but the paper mentions Y.' If you don't have information, offer to search the web or wait for document uploads."
            f"Reference previous conversations naturally when relevant. Use phrases like 'As we discussed yesterday...' or 'Following up on your question from last week...' to maintain continuity across sessions."
            f"Automatically detect when queries need current information and route to web search (news, weather, current events). Use your knowledge base for personal documents and prior conversations. For hybrid queries, combine both sources with clear attribution."
            f"For task management, always confirm actions: 'I've added 'finish OS assignment' to your tasks.' Present tasks clearly and acknowledge completions. For calendar queries, present information chronologically and concisely."
            f"You have a professional but warm personality with occasional light humor when appropriate. However, personality never overrides accuracy - drop personality elements when handling important or uncertain information."
            f"Example response: 'Based on your LifeLens project documentation, CNNs were used for image classification with a 3-layer architecture. Your notes mention using ReLU activation and max pooling. Source: LifeLens README.md'"
            f"Be helpful, accurate, and efficient. You are a persistent extension of the user's memory and productivity system."
        )
    )
    
def get_upcoming_events(access_token):
    url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    params = {
        "maxResults": 10,
        "orderBy": "startTime",
        "singleEvents": True,
        "timeMin": "2026-01-05T00:00:00Z",  # ISO format for now
    }
    r = requests.get(url, headers=headers, params=params)
    return r.json()


# Initialize ChatOpenAI model
# Initialize ChatOpenAI model (line 53-58)
model = ChatOpenAI(
    temperature=0.7, 
    model="gpt-4o-mini",
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    # Remove system_message parameter - it doesn't exist
)

# Update the /chat endpoint (line 65-92)
@app.post("/chat")
async def chat(request: Request):
    """
    Chat endpoint for discussing analysis results
    Uses the current prediction results in context
    """
    try:
        data = await request.json()
        user_message = data.get("message", "").strip()
        
        if not user_message:
            return {
                "reply": "Please enter a message.",
                "error": None
            }
        
        # Build messages for the model - include system message first
        messages = [create_system_message()] + current_results["chat_history"] + [HumanMessage(content=user_message)]
        
        # Get response from model
        response = model.invoke(messages)
        response_text = response.content
        
        # Update chat history with both user message and AI response
        current_results["chat_history"].append(HumanMessage(content=user_message))
        current_results["chat_history"].append(AIMessage(content=response_text))
        
        return {
            "reply": response_text,
            "error": None
        }
    
    except Exception as e:
        print(f"Chat error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "reply": "An error occurred while processing your message. Please try again.",
            "error": str(e)
        }


@app.post("/export/conversation")
async def export_conversation(request: Request):
    """
    Export conversation and results as JSON
    Can be used for reports or data analysis
    """
    try:
        data = await request.json()
        
        export_data = {
            "report_metadata": {
                "tool": "Prodigy",
                "version": "1.0",
                "disclaimer": "Personal use only, not ready for production"
            },
            "conversation_history": [
                {
                    "role": msg.type if hasattr(msg, 'type') else "unknown",
                    "content": msg.content if hasattr(msg, 'content') else str(msg)
                }
                for msg in current_results["chat_history"]
            ]
        }
        
        return {
            "status": "success",
            "data": export_data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

FRONTEND_URL = "http://localhost:5173"
REDIRECT_URI = "https://undefied-spriggy-germaine.ngrok-free.dev/auth/google/callback"
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

user_tokens = {}  # key: user_id or session, value: token_data

@app.get("/auth/google/callback")
async def google_callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        return JSONResponse({"error": "No code provided"}, status_code=400)

    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    r = requests.post(token_url, data=data)
    token_data = r.json()

    # ===== Store token_data securely =====
    # For demo: store by session or dummy user_id
    user_id = "demo_user"
    user_tokens[user_id] = token_data

    # ===== Redirect back to frontend =====
    frontend_url = "http://localhost:5173"  # or your deployed frontend
    return RedirectResponse(frontend_url)

@app.get("/events")
async def events():
    user_id = "demo_user"  # get this from session / auth
    token_data = user_tokens.get(user_id)
    if not token_data:
        return JSONResponse({"error": "User not authenticated"}, status_code=401)
    
    access_token = token_data["access_token"]
    events = get_upcoming_events(access_token)
    return events





# ==================== RUN SERVER ====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, reload=True)