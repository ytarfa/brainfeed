## Requirements

### Requirement: Redis connection management

The `worker-core` package SHALL export a `createRedisConnection` function that creates and returns an `ioredis` connection instance using environment variables for configuration.

#### Scenario: Redis connection with defaults
- **WHEN** `createRedisConnection()` is called without arguments
- **THEN** it SHALL connect to `REDIS_HOST` (default `localhost`), `REDIS_PORT` (default `6379`), with optional `REDIS_PASSWORD`

#### Scenario: Redis connection with custom config
- **WHEN** `createRedisConnection(config)` is called with explicit host, port, and password
- **THEN** it SHALL use the provided values instead of environment variables

### Requirement: BullMQ queue factory

The `worker-core` package SHALL export a `createQueue` function and a `createWorker` function that create BullMQ Queue and Worker instances respectively, using a shared Redis connection.

#### Scenario: Queue creation
- **WHEN** `createQueue("enrichment", connection)` is called
- **THEN** it SHALL return a BullMQ `Queue` instance connected to Redis with the name `enrichment`

#### Scenario: Worker creation
- **WHEN** `createWorker("enrichment", processorFn, connection)` is called
- **THEN** it SHALL return a BullMQ `Worker` instance that processes jobs from the `enrichment` queue using the provided processor function

### Requirement: Supabase service client for workers

The `worker-core` package SHALL export a `createServiceClient` function that creates a Supabase client using the service role key for database operations outside of request context.

#### Scenario: Service client creation
- **WHEN** `createServiceClient()` is called
- **THEN** it SHALL return a Supabase client configured with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables

### Requirement: Bookmark database helpers

The `worker-core` package SHALL export helper functions for common bookmark database operations used by workers.

#### Scenario: Update enrichment status
- **WHEN** `updateEnrichmentStatus(client, bookmarkId, status)` is called
- **THEN** it SHALL update the `enrichment_status` column of the specified bookmark to the given status and set `updated_at` to the current timestamp

#### Scenario: Write enriched data
- **WHEN** `writeEnrichedData(client, bookmarkId, data)` is called
- **THEN** it SHALL update the `enriched_data` column of the specified bookmark with the provided `EnrichedData` object, set `enrichment_status` to `"completed"`, and set `updated_at` to the current timestamp

#### Scenario: Fetch bookmark for processing
- **WHEN** `fetchBookmarkForProcessing(client, bookmarkId)` is called
- **THEN** it SHALL return the bookmark row with at minimum: `id`, `url`, `title`, `content_type`, `source_type`, `raw_content`

### Requirement: Local Redis via Docker Compose

A `docker-compose.yml` file SHALL be provided at the repository root for local development, containing a Redis 7 service.

#### Scenario: Docker Compose Redis service
- **WHEN** `docker-compose up redis` is run from the repository root
- **THEN** a Redis 7 Alpine container SHALL start on port 6379 with no authentication required

### Requirement: Worker-core environment configuration

The `worker-core` package SHALL validate required environment variables at initialization and export a typed configuration object. The configuration SHALL additionally accept `LOG_LEVEL` as an optional environment variable.

#### Scenario: Required environment variables
- **WHEN** the worker-core configuration is initialized
- **THEN** it SHALL require `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and accept optional `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, and `LOG_LEVEL` with sensible defaults

#### Scenario: Missing required variables
- **WHEN** `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is not set
- **THEN** initialization SHALL throw an error with a clear message indicating which variable is missing
