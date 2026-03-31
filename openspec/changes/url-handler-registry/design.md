## Context

Bookmark creation currently relies on 4 services (`sourceTypeStrategy.ts`, `ogTypeParser.ts`, `bookmarkService.ts`, `thumbnailService.ts`) that split URL handling into two parallel strategy hierarchies: source-type detection (hostname-first, then OG-based) and thumbnail resolution (separate strategy dispatch). The route handler (`POST /bookmarks`) orchestrates the merge manually. Adding a new URL type requires changes across all files. OG metadata is skipped entirely for hostname-matched URLs (YouTube, GitHub), losing title/description/author data.

The `ogFetcher.ts` service (cheerio-based HTML fetch + OG meta parsing) is clean and stays as-is.

## Goals / Non-Goals

**Goals:**
- Unify source-type detection, metadata extraction, and thumbnail resolution into a single per-URL-type abstraction (`UrlHandler`)
- Always fetch OG metadata as a base layer, with handlers overriding specific fields
- Make adding a new URL type a single-file operation (implement `UrlHandler`, register it)
- Simplify the route handler to a single `registry.resolve()` call
- Maintain all existing behavior (YouTube thumbnail construction, GitHub thumbnail construction, article detection)

**Non-Goals:**
- Changing the `OgFetcher` implementation or its interface
- Adding new URL types (Spotify, Twitter, etc.) — this change only migrates existing types
- Modifying the database schema or Supabase queries
- Changing frontend behavior — the response shape from `POST /bookmarks` remains compatible
- Making OG fetching optional or configurable per handler (always fetch)

## Decisions

### 1. Single `UrlHandler` interface replaces three strategy interfaces

**Decision:** One interface with `matches()` + `resolve()` + `sourceType` replaces `SourceTypeStrategy.detect()`, `OgTypeStrategy.detect()`, and `ThumbnailStrategy.supports()/resolve()`.

**Rationale:** The three current interfaces represent the same concept (handle a URL type) split artificially. A single interface reduces cognitive overhead and ensures all concerns for a URL type live together. Adding a type means one file, one registration.

**Alternative considered:** Keep detection and resolution as separate interfaces but compose them via a handler wrapper. Rejected — adds indirection without benefit since detection and resolution are always 1:1 per URL type.

### 2. OG metadata always fetched first (base layer pattern)

**Decision:** The registry always calls `ogFetcher.fetch(url)` before handler dispatch. The OG result populates `ResolvedBookmark` defaults. Handlers receive the OG data and can override any field.

**Rationale:** Currently, hostname-matched URLs (YouTube, GitHub) skip OG fetch entirely, losing title/description/author metadata. Always fetching OG ensures we capture all available metadata. Handlers then improve on it (e.g., YouTube constructs a better thumbnail URL than what OG provides).

**Trade-off:** One extra HTTP request for YouTube/GitHub URLs that previously skipped OG fetch. Acceptable because the data gain outweighs the ~200ms latency, and bookmark creation is not latency-critical.

### 3. First-match-wins handler ordering

**Decision:** `UrlHandlerRegistry` iterates handlers in registration order, uses the first one where `matches()` returns true. If none match, sourceType is `"generic"`.

**Rationale:** Simple, predictable, easy to reason about priority. YouTube handler registered before Article handler ensures YouTube URLs aren't misclassified as articles (YouTube pages have `og:type: video.other`).

**Alternative considered:** Priority numbers on handlers. Rejected — registration order is sufficient for 3-4 handlers and avoids priority collision bugs.

### 4. Null OG handled via sentinel object

**Decision:** When `ogFetcher.fetch()` returns null (network failure, non-HTML), the registry substitutes a `NULL_OG_METADATA` sentinel with all fields set to null. Handlers always receive a valid `OgMetadata` object.

**Rationale:** Eliminates null checks in every handler's `matches()` and `resolve()`. Handlers can safely access `og.title`, `og.image`, etc. without guards. The sentinel pattern is explicit and testable.

### 5. `resolve()` is async

**Decision:** `UrlHandler.resolve()` returns `Promise<Partial<ResolvedBookmark>>` even though current handlers (YouTube, GitHub) are synchronous.

**Rationale:** Future handlers may need to make HTTP requests (e.g., Twitter API for thread metadata). Making the interface async now avoids a breaking change later. Current handlers simply return resolved promises.

### 6. File structure under `services/urlHandlers/`

**Decision:**
```
services/
  ogFetcher.ts                   ← retained, unchanged
  urlHandlers/
    types.ts                     ← UrlHandler interface, ResolvedBookmark type, NULL_OG_METADATA
    youtubeHandler.ts            ← YouTubeHandler class
    githubHandler.ts             ← GitHubHandler class
    articleHandler.ts            ← ArticleHandler class
    registry.ts                  ← UrlHandlerRegistry class, singleton export
```

**Rationale:** Groups all URL handling into a cohesive module. Each handler is independently testable. The registry is the single public entry point. `types.ts` is separate from `registry.ts` to avoid circular imports if handlers need to reference the types.

## Risks / Trade-offs

- **[Latency increase for YouTube/GitHub]** Always fetching OG adds ~200ms for URLs that previously skipped it → Acceptable for bookmark creation; OG data gain is worth it. Could add parallel fetch optimization later if needed.
- **[Breaking change for imports]** Deleting 4 service files breaks any code importing from them → Impact is contained: only `bookmarks.ts` route handler and test files import these. Migration is part of this change.
- **[Test rewrite overhead]** Existing unit tests for deleted services must be replaced → New tests will be simpler (one handler = one test file) and more focused. Net reduction in test complexity.
- **[Handler ordering sensitivity]** First-match-wins means handler registration order matters → Document the ordering requirement. YouTube before Article is the only ordering constraint (YouTube pages have article-like OG metadata).
