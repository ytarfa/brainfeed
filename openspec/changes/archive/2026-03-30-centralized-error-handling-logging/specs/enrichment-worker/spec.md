## MODIFIED Requirements

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

### Requirement: GoogleApiError extends ExternalServiceError

The `GoogleApiError` class in `worker-enrichment` SHALL extend `ExternalServiceError` from `@brain-feed/error-types` instead of extending `Error` directly. It SHALL preserve its existing `status`, `code`, and `details` properties by passing them through the `context` parameter of `ExternalServiceError`.

#### Scenario: GoogleApiError hierarchy
- **WHEN** a `GoogleApiError` is thrown
- **THEN** `isAppError(error)` SHALL return `true` and `error.statusCode` SHALL be `502`

#### Scenario: GoogleApiError preserves details
- **WHEN** `new GoogleApiError("Quota exceeded", 429, "quotaExceeded", { limit: 100 })` is created
- **THEN** the error SHALL have `context: { googleStatus: 429, googleCode: "quotaExceeded", details: { limit: 100 } }` and `message: "Quota exceeded"`

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
