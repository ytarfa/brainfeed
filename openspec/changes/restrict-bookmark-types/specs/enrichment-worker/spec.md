## MODIFIED Requirements

### Requirement: Enrichment job queue

The system SHALL use a BullMQ queue named `enrichment` to manage enrichment jobs. Jobs SHALL contain the bookmark ID, user ID, content type, source type, and URL. The backend SHALL publish a job to this queue whenever a bookmark is created with `enrichment_status: "pending"`.

#### Scenario: Job published on bookmark creation
- **WHEN** a bookmark is created via `POST /api/v1/bookmarks` with `enrichment_status` set to `"pending"`
- **THEN** a job SHALL be published to the `enrichment` BullMQ queue containing `{ bookmarkId, userId, contentType, sourceType, url }`

#### Scenario: Bookmark creation succeeds when Redis is unavailable
- **WHEN** a bookmark is created but Redis is not reachable
- **THEN** the bookmark SHALL still be inserted into the database with `enrichment_status: "pending"` and no job is published

#### Scenario: All bookmarks are links and always enqueue
- **WHEN** a bookmark is created via `POST /api/v1/bookmarks`
- **THEN** `content_type` SHALL always be `"link"`, `enrichment_status` SHALL be set to `"pending"`, and an enrichment job SHALL be published

### Requirement: Enrichment pipeline routes

The enrichment pipeline SHALL define exactly three enrichment routes: `"github"`, `"youtube"`, and `"generic"`. The `EnrichmentRoute` type SHALL be `"github" | "youtube" | "generic"`. Route resolution SHALL check source type first, then URL patterns, then fall back to `"generic"`.

#### Scenario: GitHub route resolution
- **WHEN** a bookmark has `source_type: "github"` or a URL matching `github.com`
- **THEN** the pipeline SHALL route to the `githubNode`

#### Scenario: YouTube route resolution
- **WHEN** a bookmark has `source_type: "youtube"` or a URL matching `youtube.com` or `youtu.be`
- **THEN** the pipeline SHALL route to the `youtubeNode`

#### Scenario: Generic fallback route
- **WHEN** a bookmark has any other source type or URL
- **THEN** the pipeline SHALL route to the `genericNode`

### Requirement: Enrichment pipeline stub

The enrichment pipeline SHALL be implemented as a LangGraph `StateGraph` with route-specific nodes. Each node (github, youtube, generic) SHALL accept bookmark data as input and return a valid `EnrichedData` object with placeholder values.

#### Scenario: Stub pipeline execution
- **WHEN** any pipeline node is invoked with bookmark data
- **THEN** it SHALL return an `EnrichedData` object with `summary: null`, `entities: []`, `topics: []`, and a `processedAt` timestamp

### Requirement: Enrichment worker processes jobs

The enrichment worker SHALL consume jobs from the `enrichment` BullMQ queue. For each job, it SHALL update `enrichment_status` to `"processing"`, run the enrichment pipeline, and write results to the `enriched_data` column. The worker SHALL NOT check for unsupported content types since all bookmarks are links.

#### Scenario: Successful enrichment
- **WHEN** the worker picks up a job for a pending bookmark
- **THEN** it SHALL set `enrichment_status` to `"processing"`, execute the enrichment pipeline, write the result to `enriched_data` as a JSON object conforming to the `EnrichedData` interface, and set `enrichment_status` to `"completed"`

#### Scenario: Enrichment pipeline failure
- **WHEN** the enrichment pipeline throws an error during processing
- **THEN** the worker SHALL set `enrichment_status` to `"failed"` and write the error message to `enriched_data` in a structured error format

## REMOVED Requirements

### Requirement: Note bookmarks skip job publishing
**Reason**: `content_type` is now restricted to `"link"` only. Notes cannot be created.
**Migration**: All existing note bookmarks are migrated to `content_type: "link"` via DB migration.

### Requirement: Unsupported content type handling
**Reason**: With only `"link"` content type, there are no unsupported content types. The `UNSUPPORTED_CONTENT_TYPES` set and skip logic are deleted.
**Migration**: The `"unsupported"` enrichment status value remains in the DB constraint and TS type for historical records, but no new bookmarks will receive it.
