## ADDED Requirement: Instagram pipeline execution

#### Scenario: Instagram pipeline execution
- **WHEN** the Instagram pipeline node is invoked with bookmark data containing an Instagram post or reel URL
- **THEN** it SHALL classify the URL sub-type, fetch the page with Googlebot UA, extract caption and metadata from SSR HTML, invoke the LLM for summarization, and return an `EnrichedData` object with populated `summary`, `entities`, `topics`, `tags`, `metadata`, and `processedAt`

#### Scenario: Instagram pipeline with no SSR data
- **WHEN** the Instagram pipeline node is invoked but the fetched page is an empty JS shell without embedded content data
- **THEN** it SHALL throw an error so the processor sets `enrichment_status` to `"failed"` and BullMQ can retry

## MODIFIED Requirement: Enrichment pipeline stub

The enrichment pipeline SHALL be implemented as a LangGraph `StateGraph` with route-specific nodes. The YouTube node SHALL perform full enrichment (URL classification, data fetching, LLM summarization) and return a populated `EnrichedData` object. The article node SHALL perform full enrichment (HTML fetching, content extraction via Readability, OG/meta tag extraction, LLM summarization) and return a populated `EnrichedData` object. The GitHub node SHALL perform full enrichment (URL classification into repo/issue/PR, data fetching via the GitHub REST API, LLM summarization) and return a populated `EnrichedData` object. The Instagram node SHALL perform full enrichment (URL classification into post/reel, SSR HTML fetching with Googlebot UA, caption and metadata extraction, LLM summarization) and return a populated `EnrichedData` object or throw on failure. The generic node SHALL remain as a stub returning placeholder values.

## MODIFIED Requirement: Enrichment route resolution

The `resolveRoute()` function SHALL determine the enrichment route for a bookmark. The `EnrichmentRoute` type SHALL be `"github" | "youtube" | "article" | "instagram" | "generic"`. Route resolution SHALL follow this priority:

1. If `source_type` is `"youtube"`, `"github"`, `"article"`, or `"instagram"`, use that value directly
2. If URL matches YouTube patterns (`youtube.com`, `youtu.be`), route to `"youtube"`
3. If URL matches GitHub patterns (`github.com`), route to `"github"`
4. If URL matches Instagram patterns (`instagram.com`), route to `"instagram"`
5. For all other HTTP/HTTPS URLs, route to `"article"`
6. Fallback to `"generic"` for non-HTTP URLs or unrecognized schemes

#### Scenario: Route from source_type field (Instagram)
- **WHEN** a bookmark has `source_type` set to `"instagram"`
- **THEN** `resolveRoute()` SHALL return `"instagram"`

#### Scenario: Route from URL pattern (Instagram)
- **WHEN** a bookmark has no `source_type` and URL matches `instagram.com`
- **THEN** `resolveRoute()` SHALL return `"instagram"`

## MODIFIED Requirement: EnrichedData type structure

The `EnrichedData` interface SHALL be defined in `packages/types` and represent the structured output of the enrichment pipeline.

#### Scenario: EnrichedData interface shape
- **WHEN** the `EnrichedData` type is used
- **THEN** it SHALL contain: `summary` (string or null), `entities` (array of `{ name: string, type: string }`), `topics` (string array), `tags` (string array), `metadata` (record of string to string/number or null), and `processedAt` (ISO date string)

*Note: No structural change to EnrichedData. Instagram-specific metadata (instagramType, username, shortcode, mediaType, carouselMediaCount, hasAccessibilityCaption) is stored in the existing `metadata` record field.*
