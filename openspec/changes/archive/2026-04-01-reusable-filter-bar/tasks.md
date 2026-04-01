## 1. Tags API (Backend)

- [x] 1.1 Create `apps/backend/src/routes/tags.ts` with `GET /` handler that queries distinct tags from the `bookmarks` table for the authenticated user, returns sorted `string[]`
- [x] 1.2 Register the tags router at `/api/v1/tags` in the Express app
- [x] 1.3 Write tests for the tags endpoint (authenticated success, empty tags, unauthenticated 401)

## 2. Tags Hook (Frontend)

- [x] 2.1 Create `apps/frontend/src/api/hooks/useTags.ts` with `useTags()` React Query hook fetching `GET /api/v1/tags`, query key `["tags"]`
- [x] 2.2 Invalidate the `["tags"]` query on bookmark create/update/delete mutations in `useBookmarks.ts`
- [x] 2.3 Write tests for the `useTags` hook

## 3. FilterContext

- [x] 3.1 Create `apps/frontend/src/components/FilterBar/FilterContext.tsx` with `FilterProvider`, `useFilterContext`, and all filter/sort state synced to URL via `useSearchParams`
- [x] 3.2 Implement `serverParams` (type, sort, order) and `filterByTags` (AND logic) derived from context state
- [x] 3.3 Write tests for FilterProvider (URL sync, defaults, clear all, filterByTags AND logic)

## 4. FilterBar Compound Component

- [x] 4.1 Create `apps/frontend/src/components/FilterBar/FilterBar.tsx` as a flex-row layout container
- [x] 4.2 Implement `FilterBar.SourcePills` sub-component (All + source type pills, single-select)
- [x] 4.3 Implement `FilterBar.TagSelect` sub-component (multi-select dropdown with chips, hidden when no tags)
- [x] 4.4 Implement `FilterBar.Sort` sub-component (sort dropdown with Date saved, Title, Source options)
- [x] 4.5 Implement `FilterBar.ActiveFilters` sub-component (summary chips + Clear all, hidden when no active filters)
- [x] 4.6 Create `apps/frontend/src/components/FilterBar/index.ts` with re-exports
- [x] 4.7 Write tests for FilterBar sub-components (rendering, selection, interaction)

## 5. Library Page Integration

- [x] 5.1 Refactor Library page to wrap content in `FilterProvider`, replace inline sort `<select>` with `FilterBar` compound component
- [x] 5.2 Wire `serverParams` from context into `useBookmarks()` call and apply `filterByTags` to results
- [x] 5.3 Update Library tests (remove old sort select tests, add FilterBar integration tests)
- [x] 5.4 Verify with Playwright: filter by source type, select/deselect tags, change sort, clear all, URL param persistence on refresh
