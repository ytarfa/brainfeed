# Feed Sync Worker

## ADDED Requirements

### Requirement: worker-feed-sync package

A new `packages/worker-feed-sync` package runs as a standalone process that polls feeds on schedule and produces digest candidates.

#### Scenario: Package setup

WHEN the package is created
THEN it has its own `package.json` with:
  - Dependencies: `@brain-feed/worker-core`, `@brain-feed/types`, `bullmq`, `rss-parser` (or equivalent)
  - Scripts: `dev`, `build`, `start`
AND a `tsconfig.json` extending the root config with `module: "commonjs"`, `target: "ES2020"` (matching backend/worker conventions)
AND it is registered in the root `pnpm-workspace.yaml`

### Requirement: Feed sync BullMQ queue

#### Scenario: Queue definition

WHEN the feed sync worker starts
THEN a BullMQ queue named `feed-sync` is created using `createQueue` from `worker-core`
AND a BullMQ worker consumes from this queue using `createWorker` from `worker-core`

#### Scenario: Job data structure

WHEN a feed sync job is enqueued
THEN the job data includes:
  - `feedId`: uuid of the feed to sync
  - `userId`: uuid of the feed owner
  - `feedType`: string identifying the provider
  - `config`: the feed's config jsonb
  - `integrationId`: uuid or null
  - `lastSyncedAt`: ISO timestamp or null

### Requirement: Cron scheduler

The scheduler runs on a configurable interval and finds feeds that are due for sync.

#### Scenario: Finding due feeds

WHEN the scheduler runs
THEN it queries feeds where:
  - `is_active = true`
  - AND (`last_synced_at IS NULL` OR `last_synced_at + sync_frequency_interval < now()`)
AND for each due feed, it enqueues a `feed-sync` job
AND it converts `sync_frequency` text to intervals: `'15min'` → 15 minutes, `'1h'` → 1 hour, `'6h'` → 6 hours, `'daily'` → 24 hours

#### Scenario: Scheduler cadence

WHEN the worker starts
THEN the scheduler runs every 1 minute (checking for due feeds)
AND uses BullMQ's repeatable job feature or a simple `setInterval`
AND ensures only one scheduler instance runs at a time (use BullMQ job deduplication or a distributed lock)

#### Scenario: Preventing duplicate sync jobs

WHEN the scheduler finds a due feed
THEN before enqueuing, it checks that no active job for this feed is already in the queue
AND uses the feed ID as the BullMQ job ID to prevent duplicates

### Requirement: Feed sync processor

The processor handles a single feed sync job: fetches new items, deduplicates, inserts bookmarks, and enqueues enrichment.

#### Scenario: Processing a feed sync job

WHEN a feed sync job is processed
THEN it:
  1. Loads the feed provider by `feedType`
  2. If the provider requires an integration and `integrationId` is set, retrieves the token via `IntegrationService.getTokenForUser()`
  3. If a token is required but not available (integration missing, expired, or revoked), marks the feed with `last_sync_error` and skips
  4. Calls `provider.fetchNewItems(config, lastSyncedAt, token)`
  5. For each returned `FeedItem`, passes it to the feed item inserter
  6. Updates `feeds.last_synced_at` to `now()` and clears `last_sync_error`

#### Scenario: Handling fetch errors

WHEN a provider's `fetchNewItems()` throws an error
THEN the error message is stored in `feeds.last_sync_error`
AND `feeds.last_synced_at` is still updated (to prevent immediate retry; the feed will be retried at its next scheduled interval)
AND the error is logged with feed ID and provider context

### Requirement: Feed item inserter

The inserter takes a `FeedItem` from a provider and creates a digest candidate bookmark.

#### Scenario: Inserting a new feed item

WHEN a `FeedItem` is received from a provider
THEN it checks for an existing bookmark with the same `url` and `user_id`
AND if no duplicate exists:
  - Inserts a new bookmark row with:
    - `url`: the item URL
    - `title`: the item title
    - `user_id`: the feed owner
    - `space_id`: the feed's `space_id` (may be null)
    - `digest_status`: `'active'`
    - `source_id`: the feed's `id`
    - `source_name`: the feed's `display_name`
    - `published_at`: the item's `publishedAt` (if available)
    - `thumbnail`: the item's `thumbnail` (if available)
    - `source_type`: inferred from the feed type (e.g. `'youtube_channel'` → `'youtube'`)
  - Enqueues an enrichment job for the new bookmark via the existing `enrichment` BullMQ queue
AND if a duplicate exists, the item is skipped (no update, no enrichment re-trigger)

#### Scenario: Source type mapping

WHEN a feed item is inserted
THEN the `source_type` on the bookmark is set based on the feed type:
  - `'rss'` → `'article'`
  - `'youtube_channel'` → `'youtube'`
  - `'github_repo'` → `'github'`
AND this mapping is defined in the feed provider metadata

### Requirement: Health endpoint

#### Scenario: Worker health check

WHEN a GET request is made to the worker's health port (default 3003)
THEN it returns `{ status: "ok", queue: "feed-sync", active: <count>, waiting: <count> }`
AND this follows the same pattern as the enrichment worker's health endpoint

### Requirement: Docker Compose integration

#### Scenario: Adding feed sync worker to Docker Compose

WHEN the development environment is started
THEN the `worker-feed-sync` service is included in `docker-compose.yml`
AND it depends on Redis and has access to the same env vars as the enrichment worker
AND it exposes its health port (3003)

### Requirement: Environment configuration

#### Scenario: Worker environment variables

WHEN the feed sync worker starts
THEN it reads:
  - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` — from `worker-core`
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from `worker-core`
  - `FEED_SYNC_SCHEDULER_INTERVAL_MS` — optional, default `60000` (1 minute)
  - `FEED_SYNC_CONCURRENCY` — optional, default `5` (max concurrent sync jobs)
