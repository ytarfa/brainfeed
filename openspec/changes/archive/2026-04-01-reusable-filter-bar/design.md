## Context

The frontend currently has no reusable filtering or sorting system. The Library page has a local `useState`-driven `<select>` for sorting (3 options: date saved, title, source). SpaceView and PublicSpace have no sort/filter UI. Users cannot filter by source type or tags, and sort state is lost on navigation/refresh.

The backend already supports `type`, `sort`, `order`, `page`, `limit` query params on `GET /api/v1/bookmarks`. Tags are stored as `text[]` with a GIN index but have no dedicated endpoint or filtering support. The `useBookmarks` hook passes params through to the API and embeds them in React Query cache keys.

The app uses react-router-dom v7 (v6-compatible API) but has never used `useSearchParams` — all page state is local `useState`.

Styling uses inline `React.CSSProperties` with CSS custom properties, though BookmarkCard uses Tailwind-like className. Hover uses `onMouseEnter`/`onMouseLeave`. The codebase has a compound/registry pattern for detail views that serves as a reference for the compound component approach.

## Goals / Non-Goals

**Goals:**
- Reusable compound FilterBar component that can be composed differently per page
- URL-synced filter/sort state via `useSearchParams` (shareable, back-button friendly)
- Source type pill filter (single-select, server-side via existing `type` param)
- Tag multi-select filter (client-side AND logic, options from new tags endpoint)
- Sort dropdown replacing the Library's inline `<select>`
- Active filter summary with clear-all
- New `GET /api/v1/tags` endpoint for fetching user's distinct tags
- Library page as first consumer

**Non-Goals:**
- Date range filtering
- Enrichment status filtering
- Domain filtering
- Server-side tag filtering (client-side for now; GIN index available for future migration)
- Pagination changes
- SpaceView/PublicSpace integration (future, not this change)
- Tag CRUD (creating/editing/deleting tags)

## Decisions

### 1. Compound component + React Context over configuration-driven

**Decision:** Use a `FilterProvider` context with `FilterBar` compound sub-components (`FilterBar.SourcePills`, `FilterBar.TagSelect`, `FilterBar.Sort`, `FilterBar.ActiveFilters`).

**Alternatives considered:**
- **Configuration-driven** (pass `FilterConfig[]` array, renders automatically): Simpler API but less flexible for custom layouts per page. Pages can't easily rearrange, hide, or customize individual filter controls.
- **Headless hook** (returns state, each page builds own UI): Maximum flexibility but forces every page to reimplement the visual layer, defeating "consistent look everywhere."

**Rationale:** Compound components give each page full control over which filters appear and in what order, while the context provider ensures consistent state management and URL sync. The visual sub-components ensure consistent styling without forcing a rigid layout.

### 2. URL sync via `useSearchParams` in FilterProvider

**Decision:** `FilterProvider` owns a `useSearchParams` instance and derives all filter/sort state from URL search params. Setters update the URL, which triggers re-renders.

**URL format:** `?source=github&tags=react,typescript&sort=created_at&order=desc`

**Rationale:** URL-driven state is shareable, survives refresh, and works with browser back/forward. Since this is the first `useSearchParams` usage in the app, it establishes the pattern for future URL-driven features.

**Serialization rules:**
- `source`: single string value, absent = no filter (all sources)
- `tags`: comma-separated string, absent = no filter
- `sort`: column name, absent = default sort
- `order`: `asc` or `desc`, absent = default order

### 3. Client-side tag filtering with AND logic

**Decision:** Fetch all bookmarks for the current source/sort params server-side, then filter by tags in the browser using AND logic (bookmarks must have ALL selected tags).

**Alternatives considered:**
- **Server-side tag filtering** (add `tags` param to `GET /api/v1/bookmarks` using GIN `@>` operator): More correct for large datasets, but adds backend complexity now. Can migrate later since the context API (`filterByTags`) hides the implementation.

**Rationale:** Client-side is simpler to ship, and bookmark lists are typically small enough (paginated at ~50) that filtering in the browser is negligible. The GIN index is ready for a server-side migration when needed.

### 4. Tags endpoint returns flat `string[]`

**Decision:** `GET /api/v1/tags` returns a deduplicated, sorted `string[]` of all tags used by the authenticated user's bookmarks.

**Rationale:** Tags in the DB are `text[]` strings. The frontend's `Tag { id, label }` mapping (`id === label`) is a UI concern. Returning raw strings keeps the API simple and consistent with how tags are stored and sent on create/update.

### 5. FilterProvider exposes `serverParams` and `filterByTags`

**Decision:** The context exposes:
- `serverParams: { type?, sort, order }` — ready to spread into `useBookmarks()` / `useSpace()` calls
- `filterByTags: (bookmarks: Bookmark[]) => Bookmark[]` — applies client-side tag filtering

**Rationale:** This separates server-side concerns (what the API receives) from client-side concerns (post-fetch filtering), making it easy to migrate tag filtering to server-side later by moving it from `filterByTags` into `serverParams`.

### 6. File structure

```
apps/frontend/src/components/FilterBar/
  FilterContext.tsx        — context definition, FilterProvider, useFilterContext hook
  FilterBar.tsx            — compound container + sub-components
  index.ts                 — re-exports

apps/frontend/src/api/hooks/
  useTags.ts               — React Query hook for GET /api/v1/tags

apps/backend/src/routes/
  tags.ts                  — Express route handler
```

## Risks / Trade-offs

- **Client-side tag filtering may miss results on later pages**: If the API returns page 1 and the user filters by a tag that only exists on page 2 bookmarks, they'll see an empty result. → Mitigation: Currently no pagination UI exists; the default limit is large enough. When pagination is added, revisit server-side tag filtering.

- **First `useSearchParams` usage sets precedent**: Other pages may start adopting URL params inconsistently. → Mitigation: FilterProvider encapsulates the pattern; other pages should use it rather than raw `useSearchParams`.

- **Tag dropdown may be empty for new users**: Users with no bookmarks or no tags will see an empty tag filter. → Mitigation: Hide the tag select when `useTags` returns an empty array.

- **URL becomes the source of truth for sort**: Library's existing `useState<SortOption>` is replaced. Tests that check sort behavior need updating. → Mitigation: Update Library tests as part of implementation.
