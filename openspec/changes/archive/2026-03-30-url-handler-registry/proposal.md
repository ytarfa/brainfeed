## Why

URL handling logic for bookmark creation is scattered across 4 tightly-coupled services (`sourceTypeStrategy.ts`, `ogTypeParser.ts`, `bookmarkService.ts`, `thumbnailService.ts`). Adding support for a new URL type (e.g., Spotify, Twitter) requires touching all of them plus the route handler. Detection (source type) and resolution (thumbnail, metadata) are separated into different abstraction hierarchies that don't compose well, and the route handler is forced to orchestrate the merge of OG metadata with platform-specific overrides.

## What Changes

- **Introduce a `UrlHandler` interface** — a single per-URL-type abstraction that owns detection (`matches`), metadata resolution (`resolve`), and source type declaration, replacing the current split across `SourceTypeStrategy`, `OgTypeStrategy`, and `ThumbnailStrategy`.
- **Introduce a `UrlHandlerRegistry`** — an orchestrator that always fetches OG metadata first (as a base layer), finds the first matching handler, runs its async `resolve`, and merges overrides on top of OG defaults. Returns a unified `ResolvedBookmark`.
- **Always fetch OG metadata** — currently skipped for hostname-matched URLs (youtube, github). The new system always fetches OG for the base layer; handlers override specific fields (e.g., YouTube overrides `thumbnailUrl` with a constructed URL).
- **Introduce a `ResolvedBookmark` type** — normalized output of the handler system: `sourceType`, `thumbnailUrl`, `title`, `description`, `author`. The route handler consumes this directly instead of assembling fields from multiple service calls.
- **Migrate existing handlers** — `YoutubeHandler`, `GithubHandler`, `ArticleHandler` each become a single file implementing `UrlHandler`.
- **Remove replaced services** — `sourceTypeStrategy.ts`, `ogTypeParser.ts`, `thumbnailService.ts`, `bookmarkService.ts` are deleted. **BREAKING** for any code importing from these modules.
- **Simplify route handler** — the `POST /bookmarks` handler replaces multi-service orchestration with a single `ogFetcher.fetch()` + `registry.resolve()` call sequence.

## Capabilities

### New Capabilities
- `url-handler-registry`: The handler registry system — `UrlHandler` interface, `UrlHandlerRegistry` orchestrator, `ResolvedBookmark` type, and the OG-base-plus-handler-override merge pattern.

### Modified Capabilities
- `thumbnail-resolution`: Thumbnail resolution moves from a standalone service with its own strategy pattern into handler-owned `resolve()` methods. The `resolveThumbnail` function and `ThumbnailService` class are removed; thumbnails are now a field in `ResolvedBookmark` produced by the registry.

## Impact

- **Backend services** — 4 files deleted (`sourceTypeStrategy.ts`, `ogTypeParser.ts`, `thumbnailService.ts`, `bookmarkService.ts`), 1 retained (`ogFetcher.ts`), new `urlHandlers/` directory with 5 files.
- **Route handler** — `apps/backend/src/routes/bookmarks.ts` simplified: imports change, orchestration logic replaced.
- **Shared types** — `SourceType` in `@brain-feed/types` may need new variants as handlers are added (no immediate change needed for youtube/github/article/generic).
- **Tests** — Existing unit tests for deleted services must be replaced with tests for the new handler system. Test coverage for `ogFetcher.ts` is unaffected.
- **Enrichment worker** — No changes; it receives `sourceType` from the bookmark record, which is still set during creation.
