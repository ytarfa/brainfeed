## 1. Database Migration

- [x] 1.1 Create migration `supabase/migrations/YYYYMMDDHHMMSS_restrict_content_and_source_types.sql` that updates non-conforming rows (`content_type` != `'link'` → `'link'`, `source_type` not in target set → `'generic'`), drops old CHECK constraints, and adds new tight ones (`content_type` only `'link'`, `source_type` only `'github'`/`'youtube'`/`'generic'`)
- [x] 1.2 Apply migration via Supabase MCP and verify constraints are active

## 2. Shared Types

- [x] 2.1 Update `packages/types/src/app.types.ts`: narrow `ContentType` to `"link"`, narrow `SourceType` to `"github" | "youtube" | "generic"`
- [x] 2.2 Run `pnpm build` from root to verify no downstream type errors (fix any that surface before proceeding)

## 3. Backend — Bookmark Routes and Services

- [x] 3.1 Update `apps/backend/src/routes/bookmarks.ts`: change Zod `content_type` to `z.literal("link")`, remove note-specific logic (immediate completion, `raw_content` branch), ensure all bookmarks trigger thumbnail resolution and enrichment enqueue
- [x] 3.2 Update `apps/backend/src/services/sourceTypeStrategy.ts`: trim `SOURCE_TYPE_MAP` to only `github.com` → `"github"` and `youtube.com`/`youtu.be` → `"youtube"`, remove all other hostname entries
- [x] 3.3 Update `apps/backend/src/services/bookmarkService.ts`: remove `"manual"` fallback, simplify to detect from URL or default to `"generic"`
- [x] 3.4 Tighten `apps/backend/src/lib/enrichmentQueue.ts` `EnrichmentJobPayload` types: `contentType: "link"`, `sourceType: "github" | "youtube" | "generic" | null`
- [x] 3.5 Delete `apps/backend/src/routes/syncSources.ts` and remove its route mount from the router index
- [x] 3.6 Run backend tests and verify `pnpm --filter backend build` passes

## 4. Worker — Enrichment Pipeline

- [x] 4.1 Update `packages/worker-enrichment/src/enrichment-graph.ts`: narrow `EnrichmentRoute` to 3 values, trim `URL_PATTERNS` and `SOURCE_TYPE_TO_ROUTE`, delete 6 route nodes (`twitterNode`, `redditNode`, `spotifyNode`, `paperNode`, `newsNode`, `nonLinkNode`), simplify graph wiring to 3 branches
- [x] 4.2 Update `packages/worker-enrichment/src/processor.ts`: remove `UNSUPPORTED_CONTENT_TYPES` set and skip logic, tighten `EnrichmentJobData` types
- [x] 4.3 Update `packages/worker-core/src/db.ts`: tighten `BookmarkForProcessing` type annotations if beneficial
- [x] 4.4 Run worker tests and verify `pnpm build` passes for worker packages

## 5. Frontend — Components and Pages

- [x] 5.1 Update `apps/frontend/src/components/SaveItemModal.tsx`: remove note detection path, always set `content_type: "link"`, add URL validation feedback for non-URL input
- [x] 5.2 Update `apps/frontend/src/pages/Library.tsx`: remove `ContentFilter` type and filter tabs row entirely (all bookmarks are links)
- [x] 5.3 Update `apps/frontend/src/components/BookmarkCard.tsx`: trim `typeIcons` to `github`/`youtube`/`generic`, remove `isArticle` / paper styling logic
- [x] 5.4 Update `apps/frontend/src/components/ThumbnailPlaceholder.tsx`: trim `sourceColorMap` and `sourceIcons` to `github`/`youtube`/`generic`
- [x] 5.5 Delete variant files: `PaperMeta.tsx`, `SpotifyMeta.tsx`, `RedditMeta.tsx`, `TwitterMeta.tsx`; update `renderSourceMeta.tsx` variantMap to only `github` and `youtube`
- [x] 5.6 Update `apps/frontend/src/pages/SpaceSettings.tsx`: remove sync source options section and related state/API calls
- [x] 5.7 Update `apps/frontend/src/data/mock.ts`: set all `content_type` to `"link"`, change invalid source types (`"paper"`, `"news"`, `"note"`, `"reddit"`) to valid values (`"github"`, `"youtube"`, or `"generic"`)
- [x] 5.8 Run frontend tests and verify `pnpm --filter frontend build` passes

## 6. Verification

- [x] 6.1 Run full `pnpm build` from monorepo root — all packages must compile cleanly
- [ ] 6.2 Run `pnpm lint` from monorepo root — no lint errors (pre-existing: eslint not installed in backend)
- [x] 6.3 Run all existing tests across all packages (506 tests, 45 files — all green)
- [ ] 6.4 Playwright visual verification: Library page renders without filter tabs, BookmarkCard displays correct icons for github/youtube/generic, SaveItemModal rejects non-URL input, SpaceSettings has no sync source section
