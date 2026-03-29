## Context

Brain Feed bookmarks are created with `enrichment_status: "pending"` but no worker processes them. The codebase is a pnpm monorepo with `apps/backend` (Express), `apps/frontend` (React/Vite), and `packages/types` (shared types). The database is Supabase (Postgres). There is no Redis, no BullMQ, and no worker infrastructure today.

The `enriched_data` column is freeform `jsonb` with no type enforcement. The `enrichment_status` column uses a CHECK constraint limited to 4 values: `pending`, `processing`, `completed`, `failed`. The `Bookmark` app type has a `metadata?: Record<string, string | number>` field that should be replaced with typed `enriched_data`.

## Goals / Non-Goals

**Goals:**
- Establish reusable worker infrastructure (`worker-core`) for BullMQ + Redis + Supabase patterns
- Create an enrichment worker (`worker-enrichment`) that processes pending bookmarks through a LangGraph pipeline stub
- Type the `enriched_data` column with an `EnrichedData` interface and narrow `enrichment_status` to a union type
- Enable the backend to publish enrichment jobs when bookmarks are created
- Provide local Redis via Docker Compose and cloud Redis setup instructions
- Transition to incremental timestamped database migrations

**Non-Goals:**
- Implementing the actual LangGraph enrichment logic (pipeline is a stub that marks jobs as completed)
- Worker CI/CD pipeline or production deployment configuration
- Frontend changes to display enriched data
- Rate limiting, retry policies, or dead-letter queue configuration (future iteration)
- Monitoring/alerting infrastructure for the worker

## Decisions

### 1. Package structure: `worker-core` + `worker-enrichment`

**Choice:** Two separate packages under `packages/`.

**Rationale:** `worker-core` holds Redis connection management, BullMQ queue factory, and Supabase DB helpers — shared by all future workers. `worker-enrichment` is the first consumer, containing only enrichment-specific logic. This avoids duplicating infrastructure when we add digest, notification, or other workers later.

**Alternative considered:** Single `packages/worker` package with all workers in subdirectories. Rejected because it couples worker lifecycles and makes independent deployment harder.

### 2. Queue technology: BullMQ over Supabase-based polling

**Choice:** BullMQ with Redis.

**Rationale:** BullMQ provides reliable job processing with built-in retry, concurrency control, backpressure, and observability (Bull Board). A Supabase polling approach (pg_cron + status column) would work for low volume but doesn't scale, lacks backpressure, and requires custom retry logic. Since we're planning multiple workers, investing in proper queue infrastructure now pays off.

**Alternative considered:** Supabase-based queue using `pg_cron` polling `enrichment_status = 'pending'`. Simpler but poor scalability and no built-in job management.

### 3. Enrichment pipeline: LangGraph stub

**Choice:** Scaffold a LangGraph `StateGraph` with a single pass-through node that marks bookmarks as `completed` without doing real enrichment.

**Rationale:** The user has a clear plan for the pipeline internals (summarisation, entity extraction, classification) but those are implemented later. The stub validates the full flow: job pickup → status update to `processing` → pipeline execution → write `enriched_data` → status update to `completed`/`failed`.

### 4. Type design: `EnrichedData` interface with discriminated sections

**Choice:** A single `EnrichedData` interface with optional section fields (`summary`, `entities`, `topics`, `metadata`) rather than a discriminated union per source type.

**Rationale:** All source types will eventually produce the same output shape (summary + entities + topics). Source-type-specific data goes in a `metadata` record. This keeps the type simple and avoids a combinatorial explosion of per-source-type interfaces.

### 5. `EnrichmentStatus` union type with `"unsupported"` added

**Choice:** Add `"unsupported"` to both the TypeScript union and the DB CHECK constraint.

**Rationale:** Provides a clean way to mark content types (e.g., files, images) that the enrichment pipeline cannot process, distinguishing them from actual failures. This is cleaner than using `"failed"` with an error message for content that was never expected to succeed.

### 6. Job publishing: Backend publishes on bookmark creation

**Choice:** The backend's `POST /api/v1/bookmarks` route publishes a BullMQ job when `enrichment_status` is set to `"pending"`. Publishing is fire-and-forget — if Redis is down, the bookmark is still created (status stays `"pending"` for later pickup via a sweep mechanism).

**Rationale:** Keeps the bookmark creation path reliable. The worker can also sweep for `pending` bookmarks on startup as a catch-up mechanism, so no jobs are permanently lost.

**Alternative considered:** Database trigger (LISTEN/NOTIFY). Rejected because it ties the queue to Postgres and doesn't work with BullMQ.

### 7. Redis configuration

**Choice:** Docker Compose for local development (Redis 7 Alpine, port 6379, no auth). Cloud setup documented in a markdown file for the user to follow later.

**Rationale:** Docker Compose is the standard for local service dependencies. Cloud Redis (Railway, Upstash) requires account-specific setup that's better handled manually.

### 8. Migration strategy: Incremental timestamped files

**Choice:** Switch from the monolithic `supabase/migrations.sql` to a `supabase/migrations/` directory with timestamped files (e.g., `20260329120000_add_unsupported_enrichment_status.sql`). The monolithic file remains as the baseline.

**Rationale:** Incremental migrations are trackable, reviewable, and rollback-friendly. The existing monolithic file serves as the initial schema — new changes get their own timestamped migration files.

## Risks / Trade-offs

**[Redis availability]** Backend publishes jobs to Redis, but Redis could be unavailable.
  - *Mitigation:* Fire-and-forget publishing. Bookmark creation succeeds regardless. Worker sweeps for orphaned `pending` bookmarks on startup.

**[LangGraph dependency weight]** `@langchain/langgraph` and `@langchain/core` are large packages with frequent releases.
  - *Mitigation:* Pin versions. The stub is minimal — if LangGraph proves problematic, it can be replaced without changing the BullMQ/worker-core layer.

**[Migration file naming]** Supabase CLI expects specific timestamp formats for migration files. We're managing them manually, not via `supabase db diff`.
  - *Mitigation:* Use `YYYYMMDDHHMMSS` format consistently. Document naming convention in AGENTS.md.

**[Type sync with DB]** `enriched_data` is `jsonb` in Postgres with no schema enforcement. The TypeScript `EnrichedData` type is enforced only at compile time.
  - *Mitigation:* The worker writes `enriched_data` through a typed service function. Runtime validation can be added later with Zod if needed.
