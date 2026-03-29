## 1. Types & Database Migration

- [x] 1.1 Add `EnrichedData` interface and `EnrichmentStatus` union type to `packages/types/src/app.types.ts`
- [x] 1.2 Replace `metadata?: Record<string, string | number>` with `enriched_data: EnrichedData | null` on the `Bookmark` interface
- [x] 1.3 Export `EnrichedData` and `EnrichmentStatus` from `packages/types/src/index.ts`
- [x] 1.4 Create `supabase/migrations/` directory and add timestamped migration to update `enrichment_status` CHECK constraint to include `"unsupported"`
- [x] 1.5 Apply the migration to the Supabase database
- [x] 1.6 Run `pnpm --filter types build` (or type-check) to verify types compile cleanly

## 2. Documentation Updates

- [x] 2.1 Update `AGENTS.md` with incremental migration rule (use `supabase/migrations/` with timestamped files, monolithic `supabase/migrations.sql` is the baseline only)
- [x] 2.2 Update `CLAUDE.md` with the same incremental migration rule
- [x] 2.3 Create `docs/cloud-redis-setup.md` with instructions for Railway Redis / Upstash setup

## 3. Docker Compose for Local Redis

- [x] 3.1 Create `docker-compose.yml` at the repository root with Redis 7 Alpine service on port 6379
- [x] 3.2 Verify Redis starts correctly with `docker-compose up redis`

## 4. Scaffold `packages/worker-core`

- [x] 4.1 Create `packages/worker-core/` directory with `package.json`, `tsconfig.json`, `src/index.ts`
- [x] 4.2 Add dependencies: `bullmq`, `ioredis`, `@supabase/supabase-js`, `@brain-feed/types`, `dotenv`
- [x] 4.3 Implement `src/config.ts` — environment variable validation (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)
- [x] 4.4 Implement `src/redis.ts` — `createRedisConnection(config?)` function
- [x] 4.5 Implement `src/queue.ts` — `createQueue(name, connection)` and `createWorker(name, processor, connection)` factory functions
- [x] 4.6 Implement `src/db.ts` — `createServiceClient()`, `updateEnrichmentStatus()`, `writeEnrichedData()`, `fetchBookmarkForProcessing()` helper functions
- [x] 4.7 Export all public API from `src/index.ts`
- [x] 4.8 Update `pnpm-workspace.yaml` if needed (already includes `packages/*`)
- [x] 4.9 Run `pnpm install` to link the new package
- [x] 4.10 Write unit tests for `config.ts`, `redis.ts`, `queue.ts`, and `db.ts` — run with `pnpm --filter worker-core test`

## 5. Scaffold `packages/worker-enrichment`

- [x] 5.1 Create `packages/worker-enrichment/` directory with `package.json`, `tsconfig.json`, `src/index.ts`
- [x] 5.2 Add dependencies: `@brain-feed/worker-core`, `@brain-feed/types`, `@langchain/langgraph`, `@langchain/core`, `express`
- [x] 5.3 Implement `src/pipeline.ts` — LangGraph `StateGraph` stub with a single pass-through node returning placeholder `EnrichedData`
- [x] 5.4 Implement `src/processor.ts` — BullMQ job processor that uses `worker-core` DB helpers to update status and calls the pipeline
- [x] 5.5 Implement `src/health.ts` — Express HTTP health endpoint on configurable port (default 3002)
- [x] 5.6 Implement `src/index.ts` — entry point that wires up Redis connection, BullMQ worker, and health server
- [x] 5.7 Run `pnpm install` and verify the package builds with `pnpm --filter worker-enrichment build`
- [x] 5.8 Write unit tests for `pipeline.ts`, `processor.ts`, and `health.ts` — run with `pnpm --filter worker-enrichment test`

## 6. Update Backend to Publish Enrichment Jobs

- [x] 6.1 Add `@brain-feed/worker-core` as a dependency of `apps/backend`
- [x] 6.2 Create `apps/backend/src/lib/enrichmentQueue.ts` — initialise a BullMQ queue via `worker-core`, export a `publishEnrichmentJob(bookmark)` function with fire-and-forget error handling
- [x] 6.3 Update `POST /api/v1/bookmarks` in `apps/backend/src/routes/bookmarks.ts` to call `publishEnrichmentJob()` after successful bookmark insert when `enrichment_status` is `"pending"`
- [x] 6.4 Add `REDIS_HOST` and `REDIS_PORT` to `apps/backend/.env.example`
- [x] 6.5 Run existing backend tests to verify no regressions: `pnpm --filter backend test`
- [x] 6.6 Write unit tests for `enrichmentQueue.ts` verifying job publishing and Redis-down fallback behaviour

## 7. Integration Verification

- [x] 7.1 Run `pnpm build` from the root to verify all packages and apps compile
- [x] 7.2 Run `pnpm lint` from the root to verify no lint errors
- [x] 7.3 Run all tests across the monorepo to verify no regressions
