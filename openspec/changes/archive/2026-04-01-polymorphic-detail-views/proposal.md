## Why

The bookmark detail modal (`BookmarkDetail.tsx`) renders identically for every source type despite the enrichment pipeline producing rich, source-specific metadata (GitHub repo stats, YouTube duration/views, Instagram media types, article reading time). This wastes valuable data and makes all bookmarks feel generic. Each source type has unique affordances that deserve tailored presentation.

## What Changes

- Refactor `BookmarkDetail.tsx` from a monolithic 348-line modal into a thin modal shell that delegates content rendering to per-type view components via a registry pattern.
- Introduce a **component registry** mapping composite keys (`link:github`, `link:youtube`, `link:instagram`, `link:article`, `link:generic`) to dedicated detail view components, extensible to future `content_type` values (`note`, `image`, `pdf`).
- Extract reusable sections (AI summary, tags, notes, topics, entities, metadata, footer) into shared building-block components that per-type views can opt into.
- Create source-specific detail views:
  - **GitHub**: Structured header with owner/repo, stars/forks/language as first-class elements; sub-type awareness for repos, issues, and PRs.
  - **YouTube**: Styled video thumbnail with play indicator; duration, channel, views as first-class metadata; sub-type awareness for videos, channels, and playlists.
  - **Instagram**: Large image display with carousel-ready layout (single image for now, carousel when `media[]` is populated); username/caption styling; reel vs post distinction.
  - **Article**: Author/publication/reading-time emphasis; retains hero image.
  - **Default/Generic**: Extracts the current layout as the fallback.
- Add a `media` field (`MediaItem[]`) to `EnrichedData` to support future multi-media content (carousel images, video thumbnails at multiple resolutions) without pipeline changes now.
- Update mock data in `apps/frontend/src/data/mock.ts` to reflect real enrichment pipeline output keys.

## Capabilities

### New Capabilities
- `detail-view-registry`: Component registry pattern for resolving bookmark type to detail view component, including the modal shell refactor and shared building-block extraction.
- `github-detail-view`: GitHub-specific detail view with repo/issue/PR sub-type rendering and first-class metadata display.
- `youtube-detail-view`: YouTube-specific detail view with video/channel/playlist sub-type rendering and first-class metadata display.
- `instagram-detail-view`: Instagram-specific detail view with large image, carousel-ready layout, and post/reel distinction.
- `article-detail-view`: Article-specific detail view with author, publication, and reading time emphasis.

### Modified Capabilities
_(none -- no existing spec-level requirements are changing)_

## Impact

- **Frontend components**: `apps/frontend/src/components/BookmarkDetail.tsx` is refactored; new directory `apps/frontend/src/components/detailViews/` created with registry, shared components, and per-type views.
- **Shared types**: `packages/types/src/enriched-data.types.ts` gains optional `media?: MediaItem[]` field and `MediaItem` interface.
- **Mock data**: `apps/frontend/src/data/mock.ts` updated to use real enrichment pipeline metadata keys.
- **No backend changes**. No database schema changes. No enrichment pipeline changes.
- **No breaking changes** to external APIs or existing component props.
