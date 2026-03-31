## Why

The enrichment pipeline currently stubs out the `genericNode`, meaning all non-YouTube, non-GitHub bookmarks produce empty `EnrichedData`. Articles and blog posts are the most common bookmark type for knowledge workers, yet they receive no summary, entities, topics, or tags. Adding a dedicated article enrichment route unlocks the core value proposition for the majority of saved links.

## What Changes

- Add a new `"article"` route in the LangGraph enrichment graph alongside the existing `"github"`, `"youtube"`, and `"generic"` routes
- Implement an `ArticleService` that fetches HTML, extracts OG/meta tags via Cheerio, and extracts article body text via `@mozilla/readability` + `jsdom`
- Wire the article node to call the existing `enrichContent()` LLM service with the extracted text
- Update `resolveRoute()` to detect article URLs (HTML pages that pass the `isProbablyReaderable` heuristic) and route them to the new `"article"` node
- Add env-configurable content truncation (`ARTICLE_MAX_CHARS`) following the same pattern as `TRANSCRIPT_MAX_CHARS`
- Implement graceful degradation: fetch failures, non-HTML content, paywalled/unreadable pages, and LLM failures all produce the best possible result rather than empty data
- Add `@mozilla/readability` and `jsdom` as dependencies to `worker-enrichment`

## Capabilities

### New Capabilities
- `article-enrichment`: Article/web page content extraction (Readability + Cheerio) and LLM enrichment via the existing `enrichContent()` service, including metadata extraction (title, author, siteName, publishedAt, language, wordCount, readingTimeMinutes, ogImage)

### Modified Capabilities
- `enrichment-worker`: The enrichment pipeline gains a fourth route (`"article"`) and `resolveRoute()` is updated to detect article URLs. The `EnrichmentRoute` type expands from 3 to 4 values.

## Impact

- **Packages modified**: `packages/worker-enrichment` (new service, new graph node, updated routing)
- **New dependencies**: `@mozilla/readability` (~60KB), `jsdom` (~2MB) added to `worker-enrichment`
- **Existing code reused**: `enrichContent()` LLM service, `EnrichedData` type, `emptyEnrichedData()` helper, BullMQ/processor infrastructure
- **No database changes**: the existing `enriched_data` JSONB column and `source_type` enum already include `"article"`
- **No API changes**: the backend already publishes enrichment jobs for all bookmark types
- **No frontend changes**: the frontend already renders `EnrichedData` fields when present
