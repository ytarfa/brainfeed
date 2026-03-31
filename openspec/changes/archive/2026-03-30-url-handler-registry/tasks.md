## 1. Types and Shared Definitions

- [x] 1.1 Create `apps/backend/src/services/urlHandlers/types.ts` with `UrlHandler` interface, `ResolvedBookmark` type, and `NULL_OG_METADATA` sentinel
- [x] 1.2 Verify types compile cleanly (`pnpm --filter backend build` or `tsc --noEmit`)

## 2. YouTube Handler

- [x] 2.1 Create `apps/backend/src/services/urlHandlers/youtubeHandler.ts` implementing `UrlHandler` — `matches()` checks hostname + OG siteName, `resolve()` extracts video ID and constructs thumbnail URL
- [x] 2.2 Create unit tests for `YouTubeHandler` covering: standard URL, short URL, embed URL, non-extractable video ID, OG siteName detection, non-matching URL
- [x] 2.3 Run tests and verify all pass

## 3. GitHub Handler

- [x] 3.1 Create `apps/backend/src/services/urlHandlers/githubHandler.ts` implementing `UrlHandler` — `matches()` checks hostname, `resolve()` extracts owner/repo and constructs thumbnail URL
- [x] 3.2 Create unit tests for `GitHubHandler` covering: repo URL, deep URL (issue/PR), URL without owner/repo, non-matching URL
- [x] 3.3 Run tests and verify all pass

## 4. Article Handler

- [x] 4.1 Create `apps/backend/src/services/urlHandlers/articleHandler.ts` implementing `UrlHandler` — `matches()` checks OG type/author/publishedAt, `resolve()` returns empty object
- [x] 4.2 Create unit tests for `ArticleHandler` covering: og:type article, author presence, publishedAt presence, no match, empty resolve
- [x] 4.3 Run tests and verify all pass

## 5. Registry

- [x] 5.1 Create `apps/backend/src/services/urlHandlers/registry.ts` with `UrlHandlerRegistry` class — OG fetch, null sentinel substitution, handler iteration, merge logic, singleton export
- [x] 5.2 Create unit tests for `UrlHandlerRegistry` covering: matched handler merge, no handler match (generic fallback), OG fetch failure (sentinel), partial override merge, handler ordering (YouTube before Article), undefined fields not overriding base
- [x] 5.3 Run tests and verify all pass

## 6. Route Handler Migration

- [x] 6.1 Update `apps/backend/src/routes/bookmarks.ts` to import `registry` from `urlHandlers/registry` and replace multi-service orchestration with `registry.resolve(url)` call
- [x] 6.2 Remove imports of `bookmarkService` and `resolveThumbnail` from the route handler
- [x] 6.3 Verify user-provided title still takes precedence over resolved title

## 7. Cleanup

- [x] 7.1 Delete `apps/backend/src/services/sourceTypeStrategy.ts`
- [x] 7.2 Delete `apps/backend/src/services/ogTypeParser.ts`
- [x] 7.3 Delete `apps/backend/src/services/thumbnailService.ts`
- [x] 7.4 Delete `apps/backend/src/services/bookmarkService.ts`
- [x] 7.5 Delete old test files: `bookmarkService.unit.test.ts`, `thumbnailService.unit.test.ts`, `ogTypeParser.unit.test.ts`, `sourceTypeStrategy.unit.test.ts`

## 8. Final Verification

- [x] 8.1 Run full backend build (`pnpm --filter backend build`) and verify no errors
- [x] 8.2 Run all backend tests (`pnpm --filter backend exec vitest run`) and verify all pass
- [x] 8.3 Run backend linter (`pnpm --filter backend lint`) and verify no errors
