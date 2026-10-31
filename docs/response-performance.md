# Response performance and memory worker

## Response path

The browser requests streaming with `POST /chat` and `stream: true`. The backend
validates the session, attachment ownership, retry identity, and prompt budget
before returning SSE headers. It sends `ready`, `delta`, and finally `done` events.
`done` confirms that the exchange, request receipt, memory-access counters, and
maintenance job have committed in one transaction. The browser shows provisional
text immediately and marks the reply complete only after `done`.

Provider errors after headers produce an `error` event. Missing provider completion
markers, closed streams, or missing `done` confirmations do not become completed
UI messages. Drafts and request IDs survive errors. A retry replays a committed
receipt when available, or regenerates an uncommitted answer. Provisional browser
messages are removed on failure, preventing duplicate messages during retry.

Clients omitting `stream: true` retain the JSON response contract. Both paths now
perform one answer-generation call, with no classification or memory-generation
call on the response path. Full attached document text and all three memory tiers
remain supported; selected text is never silently shortened.

## Context preparation

- Query classification is deterministic. An attached file selects the document
  route; otherwise saved library content is searched by relevance when present.
- A request computes one query embedding for all applicable Chroma collections.
  Short-term, long-term and document searches run concurrently with a shared,
  bounded executor. Results retain account filters and SQL ownership/tier checks.
- Cosine distance from Chroma's by-vector API is converted to similarity. Memory
  keeps its existing 0.5 similarity threshold; document search defaults to 0.35,
  configurable with `DOCUMENT_SIMILARITY_THRESHOLD`. This is a retrieval-quality
  tradeoff to evaluate with representative questions, not an accuracy guarantee.
- No embeddings are requested when there are no stored memories and no other
  library documents to search. Files already attached in full are excluded from
  the check for whether a document search is needed.
- Embedding requests have a three-second HTTP timeout and no provider retries;
  the caller waits at most four seconds. Parallel vector searches have a combined
  four-second wait. Missing searches are explicitly marked unavailable in context.
- Google data is fetched only for schedule/task-related intent and short follow-ups
  to recent such questions. This is a heuristic and may miss indirect wording.
  Calendar and task fetching run in parallel, overlapping vector preparation.
- Successful Google snapshots are cached in PostgreSQL for 45 seconds, per account,
  across web workers. Prompts include the snapshot timestamp and cache freshness.
  Explicit requests for a refresh/latest/fresh snapshot bypass the cache. Failed
  requests are not cached; unavailable context is not treated as an empty schedule.
- Google context retrieval uses a four-second deadline, bounded per-call timeouts,
  and a five-second outer wait. Running blocking calls cannot be forcibly cancelled;
  bounded executors and request timeouts limit outstanding work. Calendar/Tasks
  pages retain their existing direct API behavior.
- Model clients are reused per process. SQL memory validation is batched; access
  updates commit with the exchange rather than individually during retrieval.

## Durable maintenance

`memory_jobs` stores one coalescing job per account. Each saved exchange increments
its generation. PostgreSQL workers claim jobs using `FOR UPDATE SKIP LOCKED`, then
commit the claim immediately. A lease/token prevents overlapping claims; expired
leases become available after a crash. The default lease lasts 15 minutes.

The worker updates `user.md`, generates due ten-exchange summaries, demotes stale
memories, and synchronizes vector indexes. Model generation does not hold the chat
lock or leave its snapshot transaction open. Markdown writes check the revision
and job lease. Stale edits fail and retry rather than overwriting a manual change.

Jobs are removed only if their generation still matches the claim. A message that
arrives during processing therefore leaves work queued. Backlogs are processed
over additional passes. Failures release the lease with exponential retry delays
up to five minutes; the durable transcript and existing Markdown remain intact.

Tier demotion checks that access metadata has not changed since selection. If a
tier changes during vector synchronization, its index is explicitly marked pending
for repair. SQL continues to validate retrieved vector hits throughout these races.

## Running locally

`npm run dev` starts Vite, the backend, and the worker through Docker Compose.
The backend and worker share the same environment/database and backend bind mount.
Restart the worker after changing its Python code; it does not use an auto-reloader.

For a backend running directly in the virtual environment, use a separate terminal:

```sh
npm run memory:worker
```

`python -m scripts.memory_worker --once`, from `backend`, processes at most one ready
job. Do not use a production database for verification. Pending jobs remain durable
when no worker is running, but memory updates and index maintenance wait for it.

## Deploying on Render

`render.yaml` now declares `prodigy-memory-worker` alongside the web service. It
uses the same Dockerfile and overrides the command with:

```sh
python -m scripts.memory_worker
```

The worker references database, OpenAI and Chroma configuration from the `prodigy`
web service. Deploy/sync the Blueprint to create the worker; a web-service-only
deployment does not automatically create it. The worker is an additional billable
Render service. Google credentials are not required by the worker.

For services managed manually, create a Docker background worker from the same
repository, set that command, and copy the same database/OpenAI/Chroma settings.
If you customize `MAX_CONTEXT_TOKENS` on the web service, configure the worker's
budget consistently as well. Blueprint environment references refresh on sync.

Deploy the matching backend, frontend and worker together. Startup creates
`memory_jobs` and `context_cache` additively. The architecture remains eventually
consistent: exact chat history is committed before completion, while Markdown,
summaries, and vector maintenance can lag behind.

## Measuring improvement

Web logs emit `chat_latency` JSON records containing request ID, lock acquisition,
context-ready, retrieval, Google wait when applicable, generation, persistence,
first-token for streams, and total duration. They include model, estimated input
tokens and character counts
but no prompt text, answer text, credentials, or account identifiers. Measurements
start inside the authenticated handler; browser/network/authentication time is extra.

Compare median and 95th-percentile first-token and total time for similar requests,
grouped by model, attachment count and prompt size. Use representative full-file,
memory-recall, Google-context and generic requests. Model/provider latency has not
been benchmarked by the automated tests; they use mocked generations and local
databases to verify ordering, concurrency, retries and persistence.

Inspect queue health privately with SQL, for example:

```sql
SELECT COUNT(*) AS pending_accounts, MAX(attempts) AS highest_retry_count
FROM memory_jobs;
```

Large or rising retry counts require checking worker logs and provider availability.
