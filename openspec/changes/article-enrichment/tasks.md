## 1. Dependencies & Setup

- [x] 1.1 Add `@mozilla/readability` and `jsdom` (plus `@types/jsdom`) as dependencies to `packages/worker-enrichment/package.json` and run `pnpm install`

## 2. Article Content Extraction Service

- [x] 2.1 Create `src/services/article-service.ts` with `ArticleService` class implementing: HTML fetch with User-Agent and timeout, Cheerio-based OG/meta/JSON-LD tag extraction, `jsdom` + `@mozilla/readability` article body extraction (always attempts parse, falls back to OG when Readability returns null/empty), content truncation via `ARTICLE_MAX_CHARS` env var (default 80,000), word count and reading time calculation, and `UnsupportedContentError` for non-HTML responses
- [x] 2.2 Write unit tests for `ArticleService` in `src/__tests__/article-service.test.ts` covering: successful extraction from readable HTML, OG/meta tag extraction, non-readable HTML fallback to OG metadata, non-HTML content type rejection, fetch failure handling, content truncation at word boundaries, timeout handling

## 3. Article Enrichment Graph Node

- [x] 3.1 Add `"article"` to the `EnrichmentRoute` type in `src/enrichment-graph.ts` and implement the `articleNode` function: call `ArticleService.extract()`, pass content to `enrichContent()`, build `EnrichedData` with metadata (title, author, siteName, publishedAt, language, wordCount, readingTimeMinutes, ogImage), handle graceful degradation (non-readable fallback, LLM failure fallback, unsupported content, fetch failure)
- [x] 3.2 Wire the `articleNode` into the LangGraph `StateGraph`: add the node, add the conditional edge from the router
- [x] 3.3 Write unit tests for the article node in `src/__tests__/article-node.test.ts` covering: full enrichment path, thin enrichment from metadata only, LLM failure fallback, fetch failure propagation, unsupported content handling

## 4. Route Resolution Update

- [x] 4.1 Update `resolveRoute()` in `src/enrichment-graph.ts` to: map `source_type === "article"` to the `"article"` route, route unmatched HTTP/HTTPS URLs to `"article"` instead of `"generic"`, keep `"generic"` as fallback for non-HTTP URLs
- [x] 4.2 Update route resolution tests in `src/__tests__/enrichment-graph.test.ts` to cover: `source_type: "article"` routing, HTTP URLs defaulting to `"article"` instead of `"generic"`, non-HTTP URLs still falling back to `"generic"`

## 5. Integration & Verification

- [x] 5.1 Run the full test suite for `worker-enrichment` (`pnpm --filter worker-enrichment exec vitest run`) and fix any failures
- [x] 5.2 Run lint and type-check (`pnpm --filter worker-enrichment build`) and fix any issues
- [x] 5.3 Verify the test pipeline script works with an article URL (`src/test-pipeline.ts` with Paul Graham's "How to Do Great Work")
