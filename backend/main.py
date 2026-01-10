from fastapi import FastAPI, File, UploadFile, Request, HTTPException, Cookie
from fastapi.middleware.cors import CORSMiddleware 
from io import BytesIO
from PIL import Image
import base64
import os
from dotenv import load_dotenv
from typing import Optional

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
    """Fetch upcoming Google Calendar events"""
    from datetime import datetime, timezone
    
    url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    # Get current time in ISO format
    now = datetime.now(timezone.utc).isoformat()
    
    params = {
        "maxResults": 50,  # Increased to get more events
        "orderBy": "startTime",
        "singleEvents": True,
        "timeMin": now,  # Start from current time
    }
    
    print(f"Fetching calendar events with timeMin: {now}")
    r = requests.get(url, headers=headers, params=params)
    response_data = r.json()
    
    if "error" in response_data:
        print(f"Calendar API error: {response_data}")
    else:
        print(f"Found {len(response_data.get('items', []))} calendar events")
    
    return response_data


def get_tasks(access_token):
    """Fetch Google Tasks"""
    # First, get the task lists
    lists_url = "https://tasks.googleapis.com/tasks/v1/users/@me/lists"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    lists_response = requests.get(lists_url, headers=headers)
    lists_data = lists_response.json()
    
    if "error" in lists_data:
        print(f"Tasks API error: {lists_data}")
        return lists_data
    
    # Get tasks from all lists
    all_tasks = []
    for task_list in lists_data.get("items", []):
        list_id = task_list["id"]
        tasks_url = f"https://tasks.googleapis.com/tasks/v1/lists/{list_id}/tasks"
        
        params = {
            "showCompleted": False,  # Only show incomplete tasks
            "showHidden": False
        }
        
        tasks_response = requests.get(tasks_url, headers=headers, params=params)
        tasks_data = tasks_response.json()
        
        if "items" in tasks_data:
            for task in tasks_data["items"]:
                task["listTitle"] = task_list.get("title", "My Tasks")
                all_tasks.append(task)
    
    print(f"Found {len(all_tasks)} tasks")
    return {"items": all_tasks}


# Initialize ChatOpenAI model
model = ChatOpenAI(
    temperature=0.7, 
    model="gpt-4o-mini",
    openai_api_key=os.getenv("OPENAI_API_KEY"),
)

# Update the /chat endpoint
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

# ==================== OAUTH CONFIGURATION ====================
FRONTEND_URL = "http://localhost:5173"
REDIRECT_URI = "https://undefied-spriggy-germaine.ngrok-free.dev/auth/google/callback"
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

user_tokens = {}  # key: user_id, value: token_data


@app.get("/auth/google/login")
async def google_login():
    """Initiate Google OAuth login"""
    # Define all scopes we need - use openid for userinfo
    scopes = [
        "openid",  # Required for userinfo
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/tasks"
    ]
    
    scope_string = " ".join(scopes)
    
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&response_type=code"
        f"&scope={scope_string}"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    
    print(f"Redirecting to OAuth with scopes: {scope_string}")
    return RedirectResponse(auth_url)


@app.get("/auth/google/callback")
async def google_callback(request: Request):
    """Handle Google OAuth callback"""
    try:
        code = request.query_params.get("code")
        error = request.query_params.get("error")
        
        if error:
            print(f"OAuth error: {error}")
            return RedirectResponse(f"{FRONTEND_URL}?error={error}")
        
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
        
        print("Exchanging code for tokens...")
        token_response = requests.post(token_url, data=data)
        
        if token_response.status_code != 200:
            print(f"Token exchange failed: {token_response.text}")
            return JSONResponse(
                {"error": "Token exchange failed", "details": token_response.text},
                status_code=token_response.status_code
            )
        
        token_data = token_response.json()
        print(f"Token data received: {list(token_data.keys())}")

        # Check if we got an access token
        if "access_token" not in token_data:
            return JSONResponse(
                {"error": "Failed to obtain access token", "details": token_data},
                status_code=400
            )

        # Fetch user info using the correct endpoint
        print("Fetching user info...")
        userinfo_resp = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",  # Use v3 endpoint
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )
        
        if userinfo_resp.status_code != 200:
            print(f"Userinfo request failed: {userinfo_resp.text}")
            # If userinfo fails, generate a fallback user ID from the token
            import hashlib
            user_id = hashlib.sha256(token_data['access_token'].encode()).hexdigest()[:16]
            user_info = {"sub": user_id, "email": "unknown@example.com"}
            print(f"Using fallback user_id: {user_id}")
        else:
            user_info = userinfo_resp.json()
            print(f"User info received: {user_info}")

        # Google OAuth2 userinfo uses "sub" for user ID
        user_id = user_info.get("sub")
        
        if not user_id:
            return JSONResponse(
                {"error": "Failed to retrieve user ID", "user_info": user_info},
                status_code=400
            )

        # Store token data
        user_tokens[user_id] = {
            "tokens": token_data,
            "profile": user_info
        }
        
        print(f"User {user_id} authenticated successfully")
        print(f"Stored tokens for user: {user_id}")

        # Redirect to frontend with success and user_id in URL
        # This helps with cookie issues when using ngrok
        response = RedirectResponse(f"{FRONTEND_URL}?auth=success&user_id={user_id}")
        response.set_cookie(
            key="user_id",
            value=user_id,
            httponly=False,  # Changed to False so JS can read it
            secure=False,
            samesite="lax",
            max_age=3600 * 24 * 7,
            domain=None,  # Let browser handle domain
            path="/"
        )
        
        print(f"Setting cookie for user_id: {user_id}")
        return response
    
    except requests.exceptions.RequestException as e:
        print(f"Request error during OAuth: {str(e)}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(f"{FRONTEND_URL}?error=oauth_failed")
    except Exception as e:
        print(f"OAuth callback error: {str(e)}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(f"{FRONTEND_URL}?error=auth_failed")


@app.get("/events")
async def events(user_id: Optional[str] = Cookie(None)):
    """Get user's Google Calendar events"""
    try:
        # Only log when debugging - initial 401s are expected
        # print(f"Events endpoint called with user_id: {user_id}")
        # print(f"Available user tokens: {list(user_tokens.keys())}")
        
        if not user_id:
            return JSONResponse(
                {"error": "not_authenticated", "message": "User not authenticated. Please log in."},
                status_code=401
            )
        
        user_data = user_tokens.get(user_id)
        if not user_data:
            return JSONResponse(
                {"error": "session_expired", "message": "Session expired. Please log in again."},
                status_code=401
            )
        
        # Get access token from stored data
        access_token = user_data["tokens"].get("access_token")
        if not access_token:
            return JSONResponse(
                {"error": "no_token", "message": "Access token not found. Please log in again."},
                status_code=401
            )
        
        print(f"Fetching events for user {user_id}")
        # Fetch events
        events_data = get_upcoming_events(access_token)
        
        # Check if the API call failed (e.g., token expired)
        if "error" in events_data:
            print(f"Calendar API error: {events_data}")
            return JSONResponse(
                {"error": "calendar_api_error", "message": "Failed to fetch calendar events", "details": events_data},
                status_code=401
            )
        
        return events_data
    
    except Exception as e:
        print(f"Error fetching events: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            {"error": "server_error", "message": "Failed to fetch events", "details": str(e)},
            status_code=500
        )


@app.get("/tasks")
async def tasks(user_id: Optional[str] = Cookie(None)):
    """Get user's Google Tasks"""
    try:
        if not user_id:
            return JSONResponse(
                {"error": "not_authenticated", "message": "User not authenticated. Please log in."},
                status_code=401
            )
        
        user_data = user_tokens.get(user_id)
        if not user_data:
            return JSONResponse(
                {"error": "session_expired", "message": "Session expired. Please log in again."},
                status_code=401
            )
        
        # Get access token from stored data
        access_token = user_data["tokens"].get("access_token")
        if not access_token:
            return JSONResponse(
                {"error": "no_token", "message": "Access token not found. Please log in again."},
                status_code=401
            )
        
        print(f"Fetching tasks for user {user_id}")
        # Fetch tasks
        tasks_data = get_tasks(access_token)
        
        # Check if the API call failed
        if "error" in tasks_data:
            print(f"Tasks API error: {tasks_data}")
            return JSONResponse(
                {"error": "tasks_api_error", "message": "Failed to fetch tasks", "details": tasks_data},
                status_code=401
            )
        
        return tasks_data
    
    except Exception as e:
        print(f"Error fetching tasks: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            {"error": "server_error", "message": "Failed to fetch tasks", "details": str(e)},
            status_code=500
        )


@app.get("/auth/status")
async def auth_status(user_id: Optional[str] = Cookie(None)):
    """Check if user is authenticated"""
    if not user_id or user_id not in user_tokens:
        return {"authenticated": False}
    
    user_data = user_tokens[user_id]
    return {
        "authenticated": True,
        "user": {
            "email": user_data["profile"].get("email"),
            "name": user_data["profile"].get("name"),
            "picture": user_data["profile"].get("picture")
        }
    }


@app.post("/auth/logout")
async def logout(user_id: Optional[str] = Cookie(None)):
    """Log out user"""
    if user_id and user_id in user_tokens:
        del user_tokens[user_id]
    
    response = JSONResponse({"status": "logged out"})
    response.delete_cookie("user_id")
    return response


# ==================== RUN SERVER ====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, reload=True)