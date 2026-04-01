## Why

The frontend has no reusable filtering or sorting system. The Library page has a bare `<select>` for sorting with local state, while SpaceView and PublicSpace have no filter/sort UI at all. Users cannot filter bookmarks by source type or tags, and sort preferences are lost on navigation. A compound FilterBar component with URL-synced state would make bookmark lists filterable, sortable, and shareable across all pages.

## What Changes

- New `FilterProvider` context that owns filter/sort state and syncs it to URL search params via `useSearchParams`
- New `FilterBar` compound component with composable sub-components: `FilterBar.SourcePills`, `FilterBar.TagSelect`, `FilterBar.Sort`, `FilterBar.ActiveFilters`
- New `GET /api/v1/tags` backend endpoint returning distinct tags for the authenticated user
- New `useTags()` frontend hook consuming the tags endpoint
- `useBookmarks` hook updated to accept and forward `tags` parameter for client-side filtering support
- Library page refactored to use `FilterProvider` + `FilterBar` instead of the inline sort `<select>`
- Source type filtering uses existing server-side `type` param; tag filtering is client-side with AND logic

## Capabilities

### New Capabilities
- `filter-bar`: Reusable compound FilterBar component with context-based state management, URL synchronization, source type pills, tag multi-select, sort dropdown, and active filter summary
- `tags-api`: Backend endpoint for fetching distinct user tags with corresponding frontend hook

### Modified Capabilities

## Impact

- **Frontend:** New components in `components/FilterBar/`, new hook in `api/hooks/useTags.ts`, Library page refactored
- **Backend:** New route in `routes/tags.ts`, registered in Express app
- **API:** New `GET /api/v1/tags` endpoint (authenticated)
- **URL structure:** Library (and later other pages) will use search params for filter state (`?source=github&tags=react,ts&sort=created_at&order=desc`)
- **Dependencies:** `react-router-dom` v7 `useSearchParams` (already available, first usage in the app)
