# Full document attachments and user.md

## Behavior

- Upload PDF, UTF-8 text, or Markdown using the attachment button. The server
  retains the complete extracted text in `document_uploads.content` and continues
  indexing chunks in the existing document vector collection.
- Uploads appear as removable cards above the composer. Click a filename to
  preview extracted text; × excludes that full document from subsequent queries.
  Saved documents can be reattached from the library. Attachments remain selected
  after sending and persist with drafts when draft autosave is enabled.
- A question includes up to five complete selected documents, `user.md`, the
  existing recent conversation, and relevant short/long-term memory and document
  search results. There is no automatic clipping of selected document text.
- Attachment filenames and IDs are saved with each user message and exported
  with the transcript. Previous attachment bodies are not automatically replayed
  from history: only the current selection adds full document text.
- Removing a card does not delete its saved text or vector chunks. Relevant
  excerpts can still appear through document search. To exclude full text,
  remove the attachment; this is not a document deletion control.
- Empty/scanned PDFs without text are rejected with an OCR explanation. Images,
  tables as images, and original PDF layout are not sent to the model.
- If embeddings fail, full-text attachment still works; the upload reports that
  indexing failed. Re-upload the same file to retry vector indexing without
  creating another upload count. Existing indexed content remains available.

## Personal Markdown memory

`user_memory` stores a living Markdown document per account. It is database
content that can be downloaded as `user.md`, rather than a shared file on the
Render container filesystem. It accompanies chat context without replacing the
three-tier memory hierarchy.

After a reply is committed, a model merges recent direct user statements into
the Markdown, keeping existing details, consolidating duplicates and applying
corrections. The update input excludes assistant answers, documents, vector
results, and Google API data. The model is instructed not to infer personal facts
from questions, quotations, or hypothetical examples, or retain credentials.
Generated memories should be reviewed; model extraction is not infallible.

Settings provides an editor, download, clear-by-saving-empty, and automatic-update
toggle. Turning automatic updates off does not exclude existing Markdown from
context; clear and save the text to exclude it. Saving an edit advances the
processing cursor to the current transcript so old messages do not immediately
repopulate deleted details. It does not delete transcripts or tier memories.
Each write checks a revision. Manual edits serialize with chat, while background
updates use revision checks so they cannot overwrite a newer manual edit.
A stale editor receives a conflict rather than overwriting newer memory.

An invalid or failed model update preserves the old Markdown and its cursor;
the durable worker retries unprocessed statements independently of chat, in batches
of up to 20. A completed answer is retained even when the memory updater fails.
Memory is eventually consistent: a quick follow-up may use the previous Markdown,
while recent exact conversation still provides immediate context. Tier summarization
retains its existing schedule but now runs in the worker. Markdown can grow to 100,000 characters; oversized
updates are rejected without replacing the existing text.

## Input budget

`MAX_CONTEXT_TOKENS` defaults to `64000` for the complete input prompt. Configure
it below the context window of the smallest enabled model, leaving room for
output. Token counting uses the model's tiktoken encoding when known and
`cl100k_base` otherwise, with per-message overhead. Unknown models use an estimate;
provider context-limit errors also return an actionable 413 response.

Oversized requests fail with an instruction to remove attachments or shorten the
question/Markdown. They do not truncate documents or write a successful chat
exchange. The original upload byte limit remains `MAX_UPLOAD_BYTES` (20 MiB by
default). A file can fit the upload limit while exceeding the input budget.

## Render rollout

Deploy the matching frontend and backend together. Startup's `init_memory_db`
adds document text/index state, attachment metadata on messages and retry receipts,
and the new `user_memory` table. Changes are additive and idempotent; the same
definitions are in `backend/storage/schema.sql`. Test the migration on an isolated
database before rollout and retain a backup per the production rollout guide.

Existing upload records have no complete text because previous versions discarded
it. The library marks these as requiring re-upload; vector retrieval still works.
Re-uploading the original file restores its text on the existing record without
incrementing the document counter.

No new Google OAuth scope or secret is required. Continue using
PostgreSQL and Chroma Cloud on Render; temporary upload files are removed after
extraction. A separate memory worker process is now required; see
[response performance and worker deployment](response-performance.md). Restart
local development to pick up new Vite proxy routes.

## Verification

Run `npm run lint`, `npm run test:ui`, and `npm run test:backend`. Backend tests
isolate AI/vector/Google calls and use temporary SQLite. PostgreSQL integration
checks require `TEST_DATABASE_URL` pointing at a disposable local database ending
in `_test`. Do not use a production database for tests.
