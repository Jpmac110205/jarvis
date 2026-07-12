# PRODIGY (JARVIS)

> A personalized AI assistant built with Retrieval-Augmented Generation (RAG), persistent memory, and real-world integrations to create an assistant that learns, remembers, and evolves with its user.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4.1-black)
![ChromaDB](https://img.shields.io/badge/VectorDB-ChromaDB-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

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
- Dynamically chunks documents
- Generates embeddings
- Stores vectors in ChromaDB
- Retrieves relevant context for future conversations

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
- Real-time web search

This reduces unnecessary retrieval while improving response quality.

---

### Google Workspace Integration

Secure OAuth authentication enables Prodigy to access:

- Google Calendar
- Google Tasks

Examples:

> "What's on my calendar tomorrow?"

> "Add 'Finish Operating Systems Assignment' to my tasks."

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

Rather than storing every conversation indefinitely, Prodigy separates memory into conversational, short-term, and long-term layers to reduce prompt size while preserving important information.

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
