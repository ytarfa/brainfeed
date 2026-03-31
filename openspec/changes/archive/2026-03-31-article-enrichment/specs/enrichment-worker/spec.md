## MODIFIED Requirements

### Requirement: Enrichment pipeline stub

The enrichment pipeline SHALL be implemented as a LangGraph `StateGraph` with route-specific nodes. The YouTube node SHALL perform full enrichment (URL classification, data fetching, LLM summarization) and return a populated `EnrichedData` object. The article node SHALL perform full enrichment (HTML fetching, content extraction via Readability, OG/meta tag extraction, LLM summarization) and return a populated `EnrichedData` object. The GitHub and generic nodes SHALL remain as stubs returning placeholder values.

#### Scenario: YouTube pipeline execution
- **WHEN** the YouTube pipeline node is invoked with bookmark data containing a YouTube URL
- **THEN** it SHALL classify the URL type, fetch relevant data (transcript/metadata), invoke the LLM for summarization, and return an `EnrichedData` object with populated `summary`, `entities`, `topics`, `tags`, `metadata`, and `processedAt`

#### Scenario: YouTube pipeline with unavailable data
- **WHEN** the YouTube pipeline node is invoked but external data fetching fails partially
- **THEN** it SHALL still produce the best possible `EnrichedData` using whatever data was successfully retrieved, rather than returning empty data

#### Scenario: Article pipeline execution
- **WHEN** the article pipeline node is invoked with bookmark data containing an article URL
- **THEN** it SHALL fetch the HTML, extract article content and metadata, invoke the LLM for summarization, and return an `EnrichedData` object with populated `summary`, `entities`, `topics`, `tags`, `metadata`, and `processedAt`

#### Scenario: Article pipeline with non-readable content
- **WHEN** the article pipeline node is invoked but the page is not readable (e.g., a web app landing page)
- **THEN** it SHALL still produce the best possible `EnrichedData` using OG/meta tag data, rather than returning empty data

#### Scenario: Stub pipeline execution for other routes
- **WHEN** the GitHub or generic pipeline node is invoked with bookmark data
- **THEN** it SHALL return an `EnrichedData` object with `summary: null`, `entities: []`, `topics: []`, and a `processedAt` timestamp

### Requirement: Enrichment route resolution

The `resolveRoute()` function SHALL determine the enrichment route for a bookmark. The `EnrichmentRoute` type SHALL be `"github" | "youtube" | "article" | "generic"`. Route resolution SHALL follow this priority:

1. If `source_type` is `"youtube"`, `"github"`, or `"article"`, use that value directly
2. If URL matches YouTube patterns (`youtube.com`, `youtu.be`), route to `"youtube"`
3. If URL matches GitHub patterns (`github.com`), route to `"github"`
4. For all other HTTP/HTTPS URLs, route to `"article"`
5. Fallback to `"generic"` for non-HTTP URLs or unrecognized schemes

#### Scenario: Route from source_type field
- **WHEN** a bookmark has `source_type` set to `"article"`
- **THEN** `resolveRoute()` SHALL return `"article"`

#### Scenario: Route from URL pattern (YouTube)
- **WHEN** a bookmark has no `source_type` and URL matches `youtube.com` or `youtu.be`
- **THEN** `resolveRoute()` SHALL return `"youtube"`

#### Scenario: Route from URL pattern (GitHub)
- **WHEN** a bookmark has no `source_type` and URL matches `github.com`
- **THEN** `resolveRoute()` SHALL return `"github"`

#### Scenario: Default HTTP URL routes to article
- **WHEN** a bookmark has no `source_type` and URL is an HTTP/HTTPS URL not matching YouTube or GitHub patterns
- **THEN** `resolveRoute()` SHALL return `"article"` instead of `"generic"`

#### Scenario: Non-HTTP URL fallback
- **WHEN** a bookmark has a non-HTTP URL scheme or no URL
- **THEN** `resolveRoute()` SHALL return `"generic"`
