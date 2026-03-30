## Requirements

### Requirement: Enrichment job queue

The system SHALL use a BullMQ queue named `enrichment` to manage enrichment jobs. Jobs SHALL contain the bookmark ID, user ID, content type, source type, URL, and `requestId` (from the originating HTTP request). The backend SHALL publish a job to this queue whenever a bookmark is created with `enrichment_status: "pending"`.

#### Scenario: Job published on bookmark creation
- **WHEN** a bookmark is created via `POST /api/v1/bookmarks` with `enrichment_status` set to `"pending"`
- **THEN** a job SHALL be published to the `enrichment` BullMQ queue containing `{ bookmarkId, userId, contentType, sourceType, url, requestId }` where `requestId` is the current request's correlation ID

#### Scenario: Bookmark creation succeeds when Redis is unavailable
- **WHEN** a bookmark is created but Redis is not reachable
- **THEN** the bookmark SHALL still be inserted into the database with `enrichment_status: "pending"` and no job is published

#### Scenario: Note bookmarks skip job publishing
- **WHEN** a bookmark is created with `content_type: "note"`
- **THEN** `enrichment_status` SHALL be set to `"completed"` and no enrichment job SHALL be published

### Requirement: Enrichment worker processes jobs

The enrichment worker SHALL consume jobs from the `enrichment` BullMQ queue. For each job, it SHALL update `enrichment_status` to `"processing"`, run the enrichment pipeline, and write results to the `enriched_data` column. The worker SHALL use a structured Pino logger from `@brain-feed/logger` instead of `console.*` calls. For each job, it SHALL create a child logger bound with `{ jobId, requestId, bookmarkId }` where `requestId` is read from the job data.

#### Scenario: Successful enrichment
- **WHEN** the worker picks up a job for a pending bookmark
- **THEN** it SHALL set `enrichment_status` to `"processing"`, execute the enrichment pipeline, write the result to `enriched_data` as a JSON object conforming to the `EnrichedData` interface, and set `enrichment_status` to `"completed"`

#### Scenario: Enrichment pipeline failure
- **WHEN** the enrichment pipeline throws an error during processing
- **THEN** the worker SHALL set `enrichment_status` to `"failed"`, log the error at `error` level with the child logger including job context, write the error message to `enriched_data` in a structured error format, and re-throw so BullMQ records the failure

#### Scenario: Unsupported content type
- **WHEN** the worker picks up a job for a content type that the pipeline cannot process
- **THEN** the worker SHALL set `enrichment_status` to `"unsupported"` without attempting pipeline execution

#### Scenario: Structured logging replaces console calls
- **WHEN** the worker starts, processes a job, or encounters an error
- **THEN** all output SHALL use the structured Pino logger (not `console.*`) with appropriate log levels: `info` for job completion, `error` for failures, `debug` for operational details

### Requirement: Enrichment pipeline stub

The enrichment pipeline SHALL be implemented as a LangGraph `StateGraph` with route-specific nodes. The YouTube node SHALL perform full enrichment (URL classification, data fetching, LLM summarization) and return a populated `EnrichedData` object. The GitHub and generic nodes SHALL remain as stubs returning placeholder values.

#### Scenario: YouTube pipeline execution
- **WHEN** the YouTube pipeline node is invoked with bookmark data containing a YouTube URL
- **THEN** it SHALL classify the URL type, fetch relevant data (transcript/metadata), invoke the LLM for summarization, and return an `EnrichedData` object with populated `summary`, `entities`, `topics`, `tags`, `metadata`, and `processedAt`

#### Scenario: YouTube pipeline with unavailable data
- **WHEN** the YouTube pipeline node is invoked but external data fetching fails partially
- **THEN** it SHALL still produce the best possible `EnrichedData` using whatever data was successfully retrieved, rather than returning empty data

#### Scenario: Stub pipeline execution for other routes
- **WHEN** the GitHub or generic pipeline node is invoked with bookmark data
- **THEN** it SHALL return an `EnrichedData` object with `summary: null`, `entities: []`, `topics: []`, and a `processedAt` timestamp

### Requirement: Worker health endpoint

The enrichment worker SHALL expose an HTTP health endpoint on a configurable port.

#### Scenario: Health check when worker is running
- **WHEN** a GET request is made to `/health`
- **THEN** the worker SHALL respond with HTTP 200 and a JSON body containing `{ status: "ok", queue: "enrichment", timestamp: <ISO string> }`

#### Scenario: Health check port configuration
- **WHEN** the `WORKER_PORT` environment variable is set
- **THEN** the health endpoint SHALL listen on that port
- **WHEN** the `WORKER_PORT` environment variable is not set
- **THEN** the health endpoint SHALL default to port 3002

### Requirement: GoogleApiError extends ExternalServiceError

The `GoogleApiError` class in `worker-enrichment` SHALL extend `ExternalServiceError` from `@brain-feed/error-types` instead of extending `Error` directly. It SHALL preserve its existing `status`, `code`, and `details` properties by passing them through the `context` parameter of `ExternalServiceError`.

#### Scenario: GoogleApiError hierarchy
- **WHEN** a `GoogleApiError` is thrown
- **THEN** `isAppError(error)` SHALL return `true` and `error.statusCode` SHALL be `502`

#### Scenario: GoogleApiError preserves details
- **WHEN** `new GoogleApiError("Quota exceeded", 429, "quotaExceeded", { limit: 100 })` is created
- **THEN** the error SHALL have `context: { googleStatus: 429, googleCode: "quotaExceeded", details: { limit: 100 } }` and `message: "Quota exceeded"`

### Requirement: EnrichedData type structure

The `EnrichedData` interface SHALL be defined in `packages/types` and represent the structured output of the enrichment pipeline.

#### Scenario: EnrichedData interface shape
- **WHEN** the `EnrichedData` type is used
- **THEN** it SHALL contain: `summary` (string or null), `entities` (array of `{ name: string, type: string }`), `topics` (string array), `metadata` (record of string to string/number or null), and `processedAt` (ISO date string)

### Requirement: EnrichmentStatus type narrowing

The `EnrichmentStatus` type SHALL be defined as a union of `"pending" | "processing" | "completed" | "failed" | "unsupported"` in `packages/types`. The database CHECK constraint SHALL be updated to include `"unsupported"`.

#### Scenario: EnrichmentStatus union type
- **WHEN** `EnrichmentStatus` is imported from `@brain-feed/types`
- **THEN** it SHALL be a union type of exactly `"pending" | "processing" | "completed" | "failed" | "unsupported"`

#### Scenario: Database CHECK constraint update
- **WHEN** the incremental migration is applied
- **THEN** the `enrichment_status` column's CHECK constraint SHALL allow values `pending`, `processing`, `completed`, `failed`, and `unsupported`

### Requirement: Bookmark type uses EnrichedData

The `Bookmark` app type SHALL replace the `metadata?: Record<string, string | number>` field with `enriched_data: EnrichedData | null`.

#### Scenario: Bookmark type shape
- **WHEN** the `Bookmark` interface is used from `@brain-feed/types`
- **THEN** it SHALL have an `enriched_data` field of type `EnrichedData | null` and SHALL NOT have a `metadata` field
