## Context

The enrichment pipeline in `packages/worker-enrichment` uses a LangGraph `StateGraph` with conditional routing. Three routes exist today: `"youtube"` (fully implemented with video/channel/playlist enrichment), `"github"` (stub), and `"generic"` (stub). The routing logic in `resolveRoute()` checks `source_type` first, then URL pattern matching, then falls back to `"generic"`.

Articles and blog posts are the most common bookmark type, yet they currently hit the `genericNode` stub and produce empty `EnrichedData`. The shared `enrichContent()` LLM service in `src/services/llm.ts` already handles structured output extraction -- it just needs article text as input.

The `SourceType` union in `@brain-feed/types` already includes `"article"`, and Cheerio is already a dependency of `worker-enrichment`.

## Goals / Non-Goals

**Goals:**
- Extract readable article text from arbitrary web pages using `@mozilla/readability` + `jsdom`
- Extract structured metadata (OG tags, JSON-LD, meta tags) using Cheerio
- Produce rich `EnrichedData` (summary, entities, topics, tags, metadata) for article bookmarks via the existing LLM service
- Degrade gracefully through a chain of fallbacks rather than producing empty results
- Follow the same architectural patterns established by the YouTube enrichment node

**Non-Goals:**
- JavaScript-rendered SPA content (no headless browser / Puppeteer) -- static HTML fetch only
- PDF, DOCX, or non-HTML document extraction
- Image/media extraction beyond OG image URL
- Paywall bypass or cookie-authenticated fetching
- Modifying the `EnrichedData` interface or database schema
- Implementing the GitHub enrichment node (remains a stub)

## Decisions

### Decision 1: Dedicated "article" route vs. implementing inside "generic"

**Choice:** Add a fourth `"article"` route to the enrichment graph.

**Rationale:** The article node has specific dependencies (`@mozilla/readability`, `jsdom`) and a distinct extraction pipeline (Readability parse, OG tag extraction) that doesn't apply to other generic content. Keeping it separate maintains the single-responsibility pattern established by the YouTube node and keeps the generic route available for future non-article content (e.g., PDFs, raw text).

**Alternatives considered:**
- Implement inside `genericNode`: Would conflate article-specific logic with a catch-all route, making it harder to add non-article generic enrichment later.

### Decision 2: `@mozilla/readability` + `jsdom` for content extraction

**Choice:** Use `@mozilla/readability` (the engine behind Firefox Reader View) with `jsdom` as the DOM implementation.

**Rationale:** Readability is battle-tested on millions of web pages via Firefox, handles diverse HTML structures, and provides clean text output plus metadata (title, byline, siteName, excerpt, lang). The `isProbablyReaderable` heuristic allows gating before a full parse, enabling fast fallback for non-article pages.

**Alternatives considered:**
- Cheerio-only text extraction: No content/boilerplate discrimination -- would include nav, footer, ads.
- `@extractus/article-extractor`: Less battle-tested, fewer contributors, less reliable on edge cases.
- `linkedom` instead of `jsdom`: Lighter but less spec-compliant; Readability relies on standard DOM APIs that `jsdom` implements more completely.

### Decision 3: Two-phase extraction (Cheerio then Readability)

**Choice:** Run Cheerio first for OG/meta tag extraction, then `jsdom` + Readability for article body.

**Rationale:** Cheerio is lightweight and fast for tag extraction. If Readability fails (non-article page), we still have OG metadata for a thin enrichment. This avoids the cost of `jsdom` DOM construction when only metadata is needed for the fallback path.

### Decision 4: Graceful degradation chain

**Choice:** Implement a four-tier fallback:
1. **Full enrichment**: Readability text + OG metadata -> LLM enrichment -> rich `EnrichedData`
2. **Thin enrichment (not readable)**: OG description + title -> LLM enrichment with limited content -> partial `EnrichedData`
3. **Metadata-only enrichment (LLM failure)**: Readability excerpt or OG description as summary, raw metadata, no entities/topics from LLM
4. **Failure**: Fetch failed or non-HTML content -> `"failed"` / `"unsupported"` status

**Rationale:** Mirrors the YouTube node's approach (transcript unavailable -> description fallback). Users get value even from partial extraction.

### Decision 5: Env-configurable content truncation

**Choice:** `ARTICLE_MAX_CHARS` environment variable (default: 80,000) following the `TRANSCRIPT_MAX_CHARS` pattern.

**Rationale:** Long-form articles can exceed LLM context limits. The YouTube node established this pattern for transcript truncation. Same default makes sense since both feed into the same `enrichContent()` LLM call.

### Decision 6: URL routing strategy for articles

**Choice:** Route to `"article"` when `source_type === "article"` or when the URL doesn't match YouTube/GitHub patterns (replacing the current generic fallback for HTTP/HTTPS URLs). The `"generic"` route remains as the catch-all for truly unrecognized content.

**Rationale:** Most non-YouTube, non-GitHub HTTP URLs are articles or web pages. The `isProbablyReaderable` check inside the article node handles the case where a URL routes to article but isn't actually an article -- it falls back to thin enrichment from metadata rather than returning empty data.

## Risks / Trade-offs

- **`jsdom` bundle size (~2MB)**: Adds significant weight to the worker package. → Acceptable since this is a server-side worker, not a browser bundle. No alternative provides equivalent Readability compatibility.

- **Fetch failures on hostile sites**: Some sites block non-browser User-Agents, serve CAPTCHAs, or redirect to login. → Set a reasonable `User-Agent` header, respect timeouts, fall back to OG metadata. Accept that some sites won't work.

- **Readability false negatives**: Some article pages may fail `isProbablyReaderable`. → Fall back to OG metadata thin enrichment. This is better than empty data.

- **Memory pressure from `jsdom`**: Parsing large HTML documents allocates significant memory. → Truncate HTML before parsing if response is very large; set fetch size limits. Worker concurrency (5) bounds parallel memory usage.

- **Content truncation loses context**: Articles over 80K chars lose their tail. → Truncation at word boundaries with a note in metadata. Most articles are well under this limit.
