# Prodigy memory and workspace rollout

This change is implemented in the working tree. No production deployment, remote database migration, or production vector write was performed during verification.

## What changed

- Conversation history was process-global, shared across users, lost on restart, and unbounded. It is now persisted in PostgreSQL, scoped to the authenticated account, and bounded to ten messages when building a prompt. The UI loads the latest 200 messages; the JSON export includes the complete transcript.
- Summary scheduling previously counted twenty messages as twenty turns and mixed users' conversations. It now summarizes ten complete exchanges per account. An interrupted summary is retried using a stable window ID, without deleting the source transcript.
- Promotion and demotion only changed the SQL tier. They now upsert the destination vector before removing the source, then acknowledge indexing in SQL. SQL retains the original content and tracks pending indexing; failed moves are retried. Both tiers contribute relevant context.
- Memory used local SQLite and separate local Chroma directories while documents used Chroma Cloud. Production memory now uses the configured PostgreSQL database and two Chroma Cloud collections. The document collection remains `prodigy_documents`.
- User IDs supplied through headers/cookies were accepted as credentials. Personal routes now require an opaque, revocable server session. OAuth state is checked; sessions expire after seven days. A forged `X-User-ID` is rejected. Profile reads/updates, retrieval, uploads, transcripts and exports are account-scoped.
- Duplicate chat submissions with the same request ID reuse the committed answer. Transcript, receipt and production usage count commit together. Duplicate file content is indexed with stable IDs and does not inflate the document counter.
- Google tokens are refreshed when needed. Calendar and task requests use timeouts, pagination and explicit errors. Calendar navigation retrieves the selected month; completed tasks come from Google rather than a hardcoded flag. All-day end dates and task due dates are interpreted as calendar dates.
- The app, landing page and privacy page have a quieter design with light/dark/system themes, phone navigation, keyboard focus, and reduced-motion support. Existing content sections remain, and memory explanations, starter prompts and conversation export have been added.
- Model options come from backend configuration, and the chosen model persists in the profile and controls replies. Fabricated prices are replaced by an explanation of usage-based costs. Notifications, images and voice remain visible with truthful availability states. Web search and task editing are explicitly described as unavailable/read only.

## Configuration

Use [backend/.env.example](../backend/.env.example) as the configuration reference. Keep the production secrets unchanged.

Production requires `DATABASE_URL` and all three `CHROMA_*` credentials. The app refuses to silently fall back to local storage when `ENVIRONMENT=production`. The PostgreSQL URL can use transaction pooling: chat serialization holds a row lock in a separate transaction, rather than a session advisory lock.

Set `FRONTEND_URL` to the full app URL, `REDIRECT_URI` to the exact registered Google callback URL, and `CORS_ORIGINS` to the frontend origins, without trailing slashes. Same-origin deployments should leave `VITE_BACKEND_URL` blank. An existing separate backend URL remains supported. Rebuild the frontend whenever `VITE_BACKEND_URL` changes.

`OPENAI_MODEL` defaults to the previous deployed model, `gpt-4.1-mini`. `ALLOWED_CHAT_MODELS` is an optional comma-separated allowlist; only configure models available to the deployed OpenAI account. Avoid changing `EMBEDDING_MODEL` against existing collections without planning a full reindex of both documents and memory.

## Preserve existing data before rollout

1. Take a PostgreSQL backup or isolated Neon branch and preserve the production host's `db/memory.db`, `db/chroma_short_term`, `db/chroma_long_term`, and uploaded source files. The local repository's database files are not evidence of the current production host's contents. The migration never deletes the source SQLite database or the original vector directories.
2. Audit the ownership of legacy summaries. The old shared history could have included another user's text in a summary. The migration preserves original ownership and content; it cannot infer the correct owner of historically mixed content. Resolve any affected rows in an audited copy before importing them. Process-only conversations that were never summarized cannot be recovered after that process exits.
3. Drain chat/upload traffic for the cutover. Use the new code in an isolated staging environment first, with staging database and Chroma Cloud configuration. Do not point development tests at the production services.
4. Inspect the copy without target connections or writes:

   ```sh
   cd backend
   ../venv/bin/python scripts/maintain_memory.py --legacy-sqlite /absolute/path/to/production-memory-backup.db
   ```

5. With the intended target environment configured, apply the additive schema and import/reindex the audited summaries:

   ```sh
   ../venv/bin/python scripts/maintain_memory.py --legacy-sqlite /absolute/path/to/production-memory-backup.db --apply
   ```

   The command creates required tables/columns/indexes, imports missing summaries, preserves existing target rows, demotes eligible stale memories and builds the new tier indexes. Conflicting duplicate IDs abort the import transaction for review; no automatic content deletion occurs. A nonzero pending-index count causes a nonzero exit code. Retrying the same command is safe.

6. Compare source/target summary counts and check one known short-term and long-term memory with a signed-in test account. Verify document retrieval still uses the existing `prodigy_documents` collection. Run Google sign-in, a calendar refresh, profile save, upload, chat, restart persistence and export against staging.
7. Ship the matching backend and freshly built frontend together. The build output is `backend/dist`; serve the app at `/app`. Production schema setup should finish before starting multiple workers. The lifespan setup is also idempotent for existing tables.
8. Users must sign in again: legacy user-ID cookies and `user_id` localStorage values deliberately do not authenticate the new release. Cross-origin frontends receive the opaque session through the OAuth URL fragment, then immediately remove it from the URL. A secure HttpOnly backend cookie also supports same-origin hosting.

## Recovery and ongoing maintenance

SQL summaries remain durable even when Chroma is unavailable. Chat repairs up to fifty pending indexes per request, under the account lock. Schedule the same maintenance command regularly to demote inactive accounts and repair indexing independently of chat:

```sh
cd backend
../venv/bin/python scripts/maintain_memory.py --apply
```

`--apply --reindex` rebuilds both memory indexes from SQL. It does not migrate/reindex personal documents. If a vector collection is lost or the Chroma database is intentionally changed, use this explicit rebuild. The SQL `indexed_tier` flag otherwise assumes a previously acknowledged vector still exists.

Monitor `Memory indexing deferred`, `Memory summary deferred`, document ingestion failures, and 5xx responses. `/health` is a process liveness check, not an assertion that OpenAI/Google/Chroma are all available. Google errors are shown separately from genuinely empty tasks or calendars.

For rollback, retain the previous release and all backups. The schema changes are additive, and legacy vector directories are untouched. Rolling back code alone will not make new PostgreSQL transcripts/summaries visible to the old SQLite-based implementation. Export/back up the new PostgreSQL data before any rollback, and do not drop the new tables as a shortcut. Avoid restoring the old identity check and shared history in a multi-user environment.

## Verification

```sh
npm ci
npm run lint
npm run build
pip install -r requirements.txt -r requirements-dev.txt
cd backend
python -m unittest discover -s tests -v
```

PostgreSQL integration tests run only when `TEST_DATABASE_URL` names a disposable database on `localhost` or `127.0.0.1` ending in `_test`. They truncate their test tables. Never set that variable to a production database.

For the browser smoke suite:

```sh
npx playwright install chromium
npm run test:ui
```

On a machine with Chrome already installed, `CHROME_EXECUTABLE` can point to that binary. The suite starts a local Vite preview, intercepts API requests using clearly labeled fixtures, blocks external requests, and writes review screenshots to `artifacts/ui`. It covers desktop/phone navigation, chat failures/retries, drafts, completed task filtering, calendar ranges, profile/model controls, persisted preferences, logout, landing content and privacy sections. This does not validate live OAuth credentials or external provider availability.

GitHub checks now run frontend build/lint/browser checks and backend tests with disposable PostgreSQL. Those hosted checks will run when the changes are pushed; they have not been executed remotely in this session.

Implementation references: [Chroma collection operations](https://docs.trychroma.com/reference/python/collection), [Neon Python connectivity](https://neon.com/docs/guides/python), and [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data).
