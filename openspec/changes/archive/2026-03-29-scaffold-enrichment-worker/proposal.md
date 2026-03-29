## Why

Bookmarks saved to Brain Feed are assigned `enrichment_status: "pending"` but nothing processes them. We need an asynchronous enrichment worker that picks up pending bookmarks, runs them through an AI-powered pipeline (summarisation, entity extraction, classification), and writes structured results back to `enriched_data`. This is the foundational infrastructure that all future workers (digest generation, notifications, etc.) will also build on.

## What Changes

- Add `EnrichedData` interface and `EnrichmentStatus` union type to `packages/types`
- Replace the freeform `metadata` field on the `Bookmark` app type with typed `enriched_data: EnrichedData | null`
- Add `"unsupported"` to the `enrichment_status` DB CHECK constraint via incremental migration
- Create `packages/worker-core` — shared Redis connection, BullMQ queue abstraction, and Supabase DB helpers reusable by all future workers
- Create `packages/worker-enrichment` — BullMQ consumer with a LangGraph-based enrichment pipeline stub and HTTP health endpoint
- Update `apps/backend` to publish enrichment jobs to the BullMQ queue when bookmarks are created with `enrichment_status: "pending"`
- Add Docker Compose config for local Redis
- Add cloud Redis setup instructions document
- Switch to incremental timestamped migrations and document this rule in `AGENTS.md` and `CLAUDE.md`
- Update `pnpm-workspace.yaml` to include the new packages

## Capabilities

### New Capabilities
- `enrichment-worker`: Asynchronous BullMQ-based worker that processes pending bookmarks through a LangGraph enrichment pipeline, writing structured results to `enriched_data`
- `worker-infrastructure`: Shared worker infrastructure (Redis connection, queue abstraction, DB helpers) reusable across all future workers

### Modified Capabilities
<!-- No existing spec-level requirements are changing. The digest and thumbnail-resolution specs remain unaffected. -->

## Impact

- **New packages:** `packages/worker-core`, `packages/worker-enrichment`
- **Modified packages:** `packages/types` (new types), `apps/backend` (job publishing)
- **Database:** Migration to add `"unsupported"` to `enrichment_status` CHECK constraint
- **Infrastructure:** Redis dependency added (Docker Compose for local, cloud setup documented)
- **Workspace config:** `pnpm-workspace.yaml` updated for new packages
- **Developer docs:** `AGENTS.md`, `CLAUDE.md` updated with incremental migration rule
- **CI/CD:** Worker CI/deployment is out of scope for this change
