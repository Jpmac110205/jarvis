
from fastapi import FastAPI, File, UploadFile, Request, HTTPException, Cookie
from fastapi.middleware.cors import CORSMiddleware 
from io import BytesIO
from PIL import Image
import base64
import os
from dotenv import load_dotenv
from typing import Optional

from fastapi.params import Body, Depends, Form
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from fastapi.responses import RedirectResponse
import requests
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from dotenv import load_dotenv

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import secrets


from storage import user_repository



# ==================== SETUP ====================
# Load .env file from the backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, '.env'))
print("OPENAI_API_KEY loaded:", bool(os.getenv("OPENAI_API_KEY")))

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://undefied-spriggy-germaine.ngrok-free.dev","https://prodigyaiassistant.onrender.com",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Content-Type", "Authorization", "X-User-ID"],
    )

# ==================== GLOBAL STATE ====================
current_results = {
    "chat_history": [],  # Will store conversation history
}
user_tokens = {}  # key: user_id, value: token_data



#Create a user class to be able to store initial keys for the database
class UserCreate(BaseModel):
    email: str
    display_name: str
    given_name: str
    family_name: str
    picture_url: Optional[str] = None
    system_prompt: Optional[str] = None
    
    
def format_google_data(events_data: dict, tasks_data: dict) -> str:
    lines = []

    # Format calendar events
    events = events_data.get("items", [])
    if events:
        lines.append("=== Upcoming Calendar Events ===")
        for event in events[:20]:  # cap at 20
            title = event.get("summary", "Untitled")
            start = event.get("start", {})
            start_time = start.get("dateTime") or start.get("date", "Unknown time")
            location = event.get("location", "")
            loc_str = f" @ {location}" if location else ""
            lines.append(f"- {title}{loc_str} | {start_time}")
    else:
        lines.append("=== No upcoming calendar events ===")

    # Format tasks
    tasks = tasks_data.get("items", [])
    if tasks:
        lines.append("\n=== Pending Tasks ===")
        for task in tasks[:20]:  # cap at 20
            title = task.get("title", "Untitled")
            due = task.get("due", "")
            due_str = f" (due {due})" if due else ""
            list_title = task.get("listTitle", "")
            lines.append(f"- [{list_title}] {title}{due_str}")
    else:
        lines.append("\n=== No pending tasks ===")

    return "\n".join(lines)


def create_system_message(user_data: dict = None, calendar_context: str = ""):
    name = user_data.get("name", "") if user_data else ""
    title = user_data.get("title", "") if user_data else ""
    location = user_data.get("location", "") if user_data else ""
    system_prompt = user_data.get("system_prompt", "") if user_data else ""

    user_line = ""
    if name or title or location:
        user_line = f"\nYour user's name is {name}, they work as a {title} based in {location}."
    custom_prompt = f"\n\nAdditional instructions from the user:\n{system_prompt}" if system_prompt else ""
    
    calendar_section = f"\n\n=== User's Live Google Data ===\n{calendar_context}" if calendar_context else ""



    return SystemMessage(
        content=(
            f"""
            You are Prodigy, a personal AI assistant designed to help the user reason, recall information, and stay productive.
            {user_line}
            When personal documents or prior conversation context are provided, treat them as the primary source of truth.
            If relevant context is missing or insufficient, state this clearly and do not fabricate information.

            When answering:
            - Prefer accuracy and clarity over verbosity.
            - Cite provided sources explicitly when using them (e.g., "According to your course notes…").
            - If sources conflict, acknowledge the uncertainty.
            - If a question cannot be answered with the available context, say so.

            Maintain a professional, calm, and helpful tone with light, restrained humor when appropriate.
            Be concise by default, and expand only when deeper explanation is clearly useful.
            {custom_prompt}
            {calendar_section}
            """
        ).strip()
    )
    
dist_dir = os.path.join(os.path.dirname(__file__), "dist")
app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")

@app.get("/")
def serve_react():
    index_file = os.path.join(dist_dir, "index.html")
    if not os.path.exists(index_file):
        raise HTTPException(status_code=404, detail="React build not found. Run `npm run build`")
    return FileResponse(index_file)

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
    model="gpt-4.1-mini",
    openai_api_key=os.getenv("OPENAI_API_KEY"),
)

# Update the /chat endpoint
@app.post("/chat")
async def chat(request: Request):
    try:
        data = await request.json()
        user_message = data.get("message", "").strip()
        
        user_id = request.headers.get("X-User-ID")
        if not user_id:
            user_id = request.cookies.get("user_id")

        user_profile = None
        calendar_context = ""

        if user_id:
            db_user = user_repository.get_user_by_google_id(user_id)
            if db_user:
                user_profile = {
                    "name": db_user.get("display_name"),
                    "title": db_user.get("title"),
                    "location": db_user.get("location"),
                    "system_prompt": db_user.get("system_prompt")
                }

            # Fetch calendar and tasks if token exists
            user_token_data = user_tokens.get(user_id)
            if user_token_data:
                access_token = user_token_data["tokens"].get("access_token")
                if access_token:
                    try:
                        events_data = get_upcoming_events(access_token)
                        tasks_data = get_tasks(access_token)
                        calendar_context = format_google_data(events_data, tasks_data)
                    except Exception as e:
                        print(f"Failed to fetch Google data for chat: {e}")

        messages = [create_system_message(user_profile, calendar_context)] + current_results["chat_history"] + [HumanMessage(content=user_message)]
        response = model.invoke(messages)
        response_text = response.content

        current_results["chat_history"].append(HumanMessage(content=user_message))
        current_results["chat_history"].append(AIMessage(content=response_text))

        return {"reply": response_text, "error": None}

    except Exception as e:
        print(f"Chat error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"reply": "An error occurred while processing your message. Please try again.", "error": str(e)}


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
FRONTEND_URL = os.getenv("FRONTEND_URL")
REDIRECT_URI = os.getenv("REDIRECT_URI")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")



@app.get("/auth/google/login")
async def google_login():
    scopes = [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/tasks"
    ]

    scope_string = " ".join(scopes)

    state = secrets.token_urlsafe(16)

    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        "&response_type=code"
        f"&scope={scope_string}"
        f"&state={state}"
        "&access_type=offline"
        "&prompt=consent"
    )

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
            secure=False,  # Allow localhost HTTP during development
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
async def events(
    user_id: Optional[str] = Cookie(None),
    request: Request = None
):
    """Get user's Google Calendar events"""
    try:
        # Try to get user_id from cookie first, then from header
        if not user_id:
            user_id = request.headers.get("X-User-ID")
        
        print(f"[/events] Attempting to fetch for user_id: {user_id}")
        
        if not user_id:
            print(f"[/events] No user_id found in cookie or header")
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
async def tasks(
    user_id: Optional[str] = Cookie(None),
    request: Request = None
):
    """Get user's Google Tasks"""
    try:
        # Try to get user_id from cookie first, then from header
        if not user_id:
            user_id = request.headers.get("X-User-ID")
        
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
async def auth_status(
    request: Request,
    user_id: Optional[str] = Cookie(None)
):
    if not user_id:
        user_id = request.headers.get("X-User-ID")
    
    if not user_id or user_id not in user_tokens:
        return {"authenticated": False}
    
    user_data = user_tokens[user_id]
    profile = user_data["profile"]

    # 🔥 Check if user exists in DB
    existing_user = user_repository.get_user_by_google_id(user_id)

    if not existing_user:
        user_repository.create_user(
            UserCreate(
                email=profile.get("email", ""),
                display_name=profile.get("name", ""),
                given_name=profile.get("given_name", ""),
                family_name=profile.get("family_name", ""),
                picture_url=profile.get("picture", ""),
                system_prompt=profile.get("system_prompt", ""),
                chats=0,
                tasks=0,
                pdfs=0
            ),
            google_id=user_id
        )
    existing_user = user_repository.get_user_by_google_id(user_id)
    return {
    "authenticated": True,
    "user": {
        "id": existing_user["id"],
        "email": profile.get("email"),
        "name": existing_user.get("display_name") or profile.get("name"),
        "picture_url": profile.get("picture"),
        "title": existing_user.get("title"),
        "location": existing_user.get("location"),
        "created_at": existing_user["created_at"].isoformat() if existing_user and existing_user.get("created_at") else None,
        "system_prompt": existing_user.get("system_prompt") or "",
        "chats_number": existing_user.get("chats", 0) if existing_user else 0,
        "tasks_number": existing_user.get("tasks", 0) if existing_user else 0,
        "pdfs_number": existing_user.get("pdfs", 0) if existing_user else 0,    
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


    
#Post endpoint to create a user in the database
@app.post("/users")
def create_user(user: UserCreate):
    user_repository.create_user(user)
    return {"message": "User created"}

#Get users endpoint to retrieve all users from the database
@app.get("/users/{user_id}")
def get_user(user_id: int):
    user = user_repository.get_user_by_id(user_id)
    if not user:
        return {"error": "User not found"}
    return user

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    system_prompt: Optional[str] = None
@app.put("/users/{user_id}")
def update_user(user_id: int, user: UserUpdate):
    user_repository.update_user(user_id, {
        "display_name": user.name,
        "given_name": user.name.split(" ")[0] if user.name else "",
        "family_name": " ".join(user.name.split(" ")[1:]) if user.name and len(user.name.split(" ")) > 1 else "",
        "title": user.title,
        "location": user.location,
        "system_prompt": user.system_prompt,
        "tasks": user.tasks_number,
        "chats": user.chats_number,
        "pdfs": user.pdfs_number,
        "picture_url": user.picture_url if user.picture_url else None
    })
    updated = user_repository.get_user_by_id(user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

    
# ==================== RUN SERVER ====================
if __name__ == "__main__":
    import uvicorn
    # Read PORT from environment with a sensible default
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, log_level="info")
