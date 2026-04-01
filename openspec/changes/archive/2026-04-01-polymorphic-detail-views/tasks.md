## 1. Foundation — Types, Registry, and MediaItem

- [x] 1.1 Add `MediaItem` interface and optional `media` field to `EnrichedData` in `packages/types/src/enriched-data.types.ts`
- [x] 1.2 Create `apps/frontend/src/components/detailViews/types.ts` with `DetailViewProps` interface and `DetailViewKey` type
- [x] 1.3 Create `apps/frontend/src/components/detailViews/registry.ts` with `resolveDetailView()` function — composite key resolution (`link:<sourceType>`, direct `contentType` for non-link), fallback to `DefaultDetailView`
- [x] 1.4 Run `pnpm --filter frontend lint` and fix any type errors in foundation files

## 2. Extract Shared Building Blocks from BookmarkDetail.tsx

- [x] 2.1 Create `detailViews/shared/DetailSummary.tsx` — AI summary section with enrichment status handling
- [x] 2.2 Create `detailViews/shared/DetailTopics.tsx` — topic pills section
- [x] 2.3 Create `detailViews/shared/DetailEntities.tsx` — entity chips section
- [x] 2.4 Create `detailViews/shared/DetailMetadata.tsx` — generic key-value metadata chips
- [x] 2.5 Create `detailViews/shared/DetailTags.tsx` — tag pills with "+ Add tag" button
- [x] 2.6 Create `detailViews/shared/DetailSpace.tsx` — space name with color dot
- [x] 2.7 Create `detailViews/shared/DetailNotes.tsx` — notes textarea section
- [x] 2.8 Create `detailViews/shared/DetailFooter.tsx` — "Open original source" footer link
- [x] 2.9 Run `pnpm --filter frontend lint` and fix any type errors in shared components

## 3. Default Detail View and Modal Shell Refactor

- [x] 3.1 Create `detailViews/views/DefaultDetailView.tsx` — composed from shared blocks, matching current BookmarkDetail body (hero image, title area, summary, topics, entities, metadata, tags, space, notes, footer)
- [x] 3.2 Refactor `BookmarkDetail.tsx` to modal shell only — overlay, animation, escape key, close button, dialog ARIA; delegates scrollable body to `resolveDetailView(bookmark)`
- [x] 3.3 Verify that the default view renders identically to the previous monolithic BookmarkDetail for all bookmark types
- [x] 3.4 Run `pnpm --filter frontend lint` and fix any type errors
- [x] 3.5 Run existing frontend tests and fix any failures
- [x] 3.6 Verify modal open/close, escape key, and default view rendering via Playwright

## 4. GitHub Detail View

- [x] 4.1 Create `detailViews/views/GitHubDetailView.tsx` with sub-type routing by `metadata.githubType` (`repo` / `issue` / `pr`)
- [x] 4.2 Implement repo header — owner/repo identity, stars, forks, language, license, open issues as structured elements (no hero image)
- [x] 4.3 Implement issue layout — issue number, state (open/closed) indicator, author, comment count, labels pills
- [x] 4.4 Implement PR layout — PR number, state, merge status indicator, author, diff stats (additions/deletions/changed files), labels pills
- [x] 4.5 Compose shared blocks: DetailSummary, DetailTags, DetailNotes, DetailSpace, DetailFooter
- [x] 4.6 Register `link:github` in the registry
- [x] 4.7 Run `pnpm --filter frontend lint` and fix any type errors
- [x] 4.8 Write unit tests for GitHub view (repo, issue, PR variants)
- [x] 4.9 Verify GitHub repo, issue, and PR detail views via Playwright

## 5. YouTube Detail View

- [x] 5.1 Create `detailViews/views/YouTubeDetailView.tsx` with sub-type routing by metadata keys (`videoId` → video, `channelId` → channel, `playlistId` → playlist)
- [x] 5.2 Implement video layout — large thumbnail with centered play icon overlay (clickable, links to original URL), title, channel name, formatted view count, duration
- [x] 5.3 Implement channel layout — channel name, subscriber count, video count
- [x] 5.4 Implement playlist layout — playlist title, item count, channel attribution
- [x] 5.5 Compose shared blocks: DetailSummary, DetailTags, DetailNotes, DetailSpace, DetailFooter
- [x] 5.6 Register `link:youtube` in the registry
- [x] 5.7 Run `pnpm --filter frontend lint` and fix any type errors
- [x] 5.8 Write unit tests for YouTube view (video, channel, playlist variants)
- [x] 5.9 Verify YouTube video, channel, and playlist detail views via Playwright

## 6. Instagram Detail View

- [x] 6.1 Create `detailViews/views/InstagramDetailView.tsx` — large image display (60-70% of modal viewport), post vs reel distinction
- [x] 6.2 Implement single image rendering — thumbnail_url fallback when no `media` array, reel play-icon overlay for video content
- [x] 6.3 Implement carousel component — dot indicators, left/right navigation arrows, single-image graceful degradation (no dots/arrows)
- [x] 6.4 Implement username display (`@username` styled) and caption below image
- [x] 6.5 Compose shared blocks: DetailSummary, DetailTags, DetailNotes, DetailSpace; optional custom "Open on Instagram" footer
- [x] 6.6 Register `link:instagram` in the registry
- [x] 6.7 Run `pnpm --filter frontend lint` and fix any type errors
- [x] 6.8 Write unit tests for Instagram view (post, reel, carousel, no-image variants)
- [x] 6.9 Verify Instagram post and reel detail views via Playwright

## 7. Article Detail View

- [x] 7.1 Create `detailViews/views/ArticleDetailView.tsx` — hero image retained, author/reading-time emphasis
- [x] 7.2 Implement hero image — thumbnail_url or ogImage fallback, ThumbnailPlaceholder when neither exists
- [x] 7.3 Implement subtitle line — "siteName · by Author · X min read" with graceful omission of missing fields, optional word count display
- [x] 7.4 Compose shared blocks: DetailSummary, DetailTopics, DetailEntities, DetailTags, DetailNotes, DetailSpace, DetailFooter
- [x] 7.5 Register `link:article` in the registry
- [x] 7.6 Run `pnpm --filter frontend lint` and fix any type errors
- [x] 7.7 Write unit tests for Article view (full metadata, partial metadata, no image variants)
- [x] 7.8 Verify Article detail view via Playwright

## 8. Mock Data Update

- [x] 8.1 Update GitHub mock bookmark (`b1`) enriched_data to use real pipeline keys: add `githubType: "repo"`, `owner`, `repo`, rename/add keys to match real pipeline output
- [x] 8.2 Update YouTube mock bookmark (`b3`) enriched_data: add `videoId`, use `channelTitle` (not `channel`), `viewCount` (not `views`), add `durationSeconds`, `transcriptAvailable`, `publishedAt`
- [x] 8.3 Add an article mock bookmark with enriched_data using real pipeline keys: `title`, `author`, `siteName`, `readingTimeMinutes`, `wordCount`, `ogImage`
- [x] 8.4 Add an Instagram mock bookmark with enriched_data using real pipeline keys: `instagramType`, `shortcode`, `username`, `mediaType`
- [x] 8.5 Verify all mock bookmarks render correctly in their respective detail views via Playwright

## 9. Final Verification

- [x] 9.1 Run full lint: `pnpm --filter frontend lint`
- [x] 9.2 Run full test suite: `pnpm --filter frontend exec vitest run`
- [x] 9.3 Run full build: `pnpm --filter frontend build`
- [x] 9.4 Comprehensive Playwright walkthrough: open each bookmark type, verify layout, close modal, check animations, test escape key and click-outside
