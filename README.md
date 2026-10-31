# PRODIGY (JARVIS)

> A personalized AI assistant built with Retrieval-Augmented Generation (RAG), persistent memory, and real-world integrations to create an assistant that learns, remembers, and evolves with its user.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4.1-black)
![ChromaDB](https://img.shields.io/badge/VectorDB-ChromaDB-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## Running locally and on Render

With Docker Desktop running and credentials configured in `backend/.env`, run:

```bash
npm install
npm run dev
```

Open http://localhost:8000. This starts Vite on port 8000 and the same FastAPI
backend used in production in Docker on port 8080. Vite forwards API requests to
that backend. Frontend and Python edits reload automatically. Stop with Ctrl+C;
use `docker compose down` to remove the development container. Kubernetes and
port forwarding are not needed for this workflow; stop any port forward using
port 8000 before starting development.

Register `http://localhost:8000/auth/google/callback` in your Google OAuth client's
authorized redirect URIs. Compose sets the local callback and frontend URLs.
Keep `VITE_BACKEND_URL` blank so requests use the current site's origin.

Render uses `render.yaml` and the Dockerfile to build the frontend and serve it
alongside the API in one web service. Configure the credentials listed in
`backend/.env.example` in Render. By default the app derives its public URLs from
Render's `RENDER_EXTERNAL_URL`; register
`https://YOUR-SERVICE.onrender.com/auth/google/callback` with Google too.
For a custom domain, set `FRONTEND_URL=https://YOUR-DOMAIN/app` and
`REDIRECT_URI=https://YOUR-DOMAIN/auth/google/callback`. Remove stale localhost
values from Render's `FRONTEND_URL`, `REDIRECT_URI`, and `CORS_ORIGINS` settings.
Each environment runs its own backend process using the same application code.

## Overview

Most AI assistants are stateless. Every conversation starts from scratch, uploaded documents disappear after the session, and they have little understanding of a user's long-term context.

**PRODIGY** was built to solve that problem.

Inspired by Iron Man's JARVIS, Prodigy combines Retrieval-Augmented Generation (RAG), persistent memory, document understanding, and Google integrations into a single AI assistant capable of remembering conversations, answering questions from personal documents, managing tasks, and providing context-aware responses.

Unlike traditional chatbots, Prodigy continuously builds a knowledge base unique to each user.

---

## Features

### Persistent Document Knowledge (RAG)

Upload PDFs, notes, or documents once.

Prodigy automatically:

- Extracts text
- Saves the complete extracted text in your account database
- Attaches it to your question, with a preview and × to remove it
- Dynamically chunks documents
- Generates embeddings
- Stores vectors in ChromaDB
- Retrieves relevant context for future conversations

PDF, `.txt`, and `.md` uploads support full-text questions. Attached documents
stay with your questions until removed; saved documents can be reattached.
The model receives all extracted text, subject to an explicit input budget,
rather than only matching chunks. PDF images and layout are not included.

Alongside the three memory tiers, an account-specific `user.md` records explicit
facts, preferences, and projects from your messages. It updates after successful
chat exchanges and accompanies future questions. Review, edit, download, clear,
or pause automatic updates in **Settings → Your memory**. The Markdown is stored
in PostgreSQL in production so it survives Render restarts.

See [document attachments and user memory](docs/document-memory.md) for rollout,
configuration, and limits. Older uploads must be re-uploaded to restore full text.

Replies stream as they are generated. Markdown updates, summaries and vector
maintenance run in a durable worker so they do not delay a completed answer.
`npm run dev` starts this worker locally. Production deployments must also run the
worker declared in `render.yaml`; see [response performance](docs/response-performance.md).

Example:

> "Summarize the CNN architecture from my LifeLens project."

---

### Multi-Layer Memory

Instead of treating every conversation equally, Prodigy separates memory into three layers.

**Conversational Memory**

- Recent chat history
- Maintains natural conversation flow

**Short-Term Memory**

Frequently referenced facts

Examples:

- User preferences
- Active projects
- Important personal information

**Long-Term Memory**

Stores less frequently accessed information using recency weighting and retrieval scoring so important memories remain accessible without bloating prompts.

---

### Intelligent Retrieval Routing

Not every question should trigger RAG.

Prodigy determines whether a request should use:

- Personal knowledge base (RAG)
- LLM pretrained knowledge
- Requests requiring current web information (identified; live search is not connected)

This reduces unnecessary retrieval while improving response quality.

---

### Google Workspace Integration

Secure OAuth authentication enables Prodigy to access:

- Google Calendar
- Google Tasks

Examples:

> "What's on my calendar tomorrow?"

> "Add 'Finish Operating Systems Assignment' to my tasks."

Google access is currently read only; the task-creation example above requires a future write integration.

Calendar events are automatically formatted and injected into the system prompt, allowing responses to remain context-aware.

---

### Personalized AI Profiles

Each user has their own:

- Profile
- Memory
- Documents
- Calendar
- Preferences
- Conversation history

Authentication ensures user data remains isolated while enabling future support for multiple users.

---

## Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS

### Backend

- FastAPI
- Python

### AI

- OpenAI GPT-4.1
- OpenAI Embeddings

### Vector Database

- ChromaDB

### Authentication

- Google OAuth2

### Storage

- PostgreSQL
- ChromaDB

---

## System Architecture

```
                 User
                  │
                  ▼
          React Frontend
                  │
                  ▼
           FastAPI Backend
                  │
      ┌───────────┼────────────┐
      ▼           ▼            ▼
 Google APIs   OpenAI API   ChromaDB
      │           │            │
 Calendar     GPT-4.1      Embeddings
 Tasks       Generation      Memory
```

---

## RAG Pipeline

```
PDF Upload
     │
     ▼
Text Extraction
     │
     ▼
Dynamic Chunking
     │
     ▼
Embedding Generation
     │
     ▼
Store in ChromaDB
     │
     ▼
Semantic Retrieval
     │
     ▼
Relevant Context
     │
     ▼
GPT-4 Response
```

---

## Example Workflow

1. Upload a PDF.
2. Prodigy parses the document.
3. Text is dynamically chunked.
4. Chunks are embedded and stored.
5. User asks a question.
6. Relevant chunks are retrieved.
7. Retrieved context is combined with conversational memory.
8. GPT generates a grounded response with citations.

---

## Design Decisions

### Layered Memory

Rather than including every saved conversation in each prompt, Prodigy separates memory into conversational, short-term, and long-term layers to reduce prompt size while preserving important information.

---

### Retrieval Routing

Instead of always performing vector search, Prodigy first determines whether the query requires:

- retrieval
- pretrained model knowledge
- live web information

This significantly improves efficiency while reducing hallucinations.

---

### Persistent Vector Storage

Uploaded documents are embedded once and reused across future sessions, eliminating repeated processing while creating a growing personal knowledge base.

---

## Production maintenance and verification

See [the production rollout guide](docs/production-rollout.md) for the memory fixes, configuration, non-destructive legacy migration, test commands, and rollback limits. Production memory now uses PostgreSQL and Chroma Cloud, with verified account sessions and retryable vector indexing.

## Future Improvements

- Multi-user vector database architecture
- Cloud-hosted persistent ChromaDB
- Voice interaction
- Mobile application
- Multi-agent workflows
- Email integration
- Local LLM support
- Advanced memory ranking algorithms

---

## Lessons Learned

Building Prodigy taught me significantly more than simply integrating an LLM API.

Some of the engineering challenges included:

- Designing scalable RAG pipelines
- Preventing prompt bloat
- Structuring persistent memory
- Building secure OAuth authentication
- Optimizing document chunking
- Routing requests between multiple knowledge sources
- Integrating external APIs into a production-style architecture

More importantly, it reinforced that building AI applications is not just about prompting an LLM—it's about designing the surrounding systems that make those models genuinely useful.

---

## Why I Built Prodigy

I wanted an assistant that didn't forget everything after every conversation.

Instead of creating another chatbot, I built a system that remembers my projects, understands my documents, knows my schedule, and becomes more useful over time.

The long-term vision is simple:

> Build an AI assistant that feels less like a chatbot and more like a true personal software companion.

---

## License

This project is licensed under the MIT License.
