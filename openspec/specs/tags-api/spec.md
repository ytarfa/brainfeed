## ADDED Requirements

### Requirement: Tags endpoint returns user's distinct tags
The backend SHALL expose a `GET /api/v1/tags` endpoint that returns all distinct tags used across the authenticated user's bookmarks as a sorted `string[]`.

#### Scenario: User with tagged bookmarks
- **WHEN** an authenticated user requests `GET /api/v1/tags` and they have bookmarks with tags `["react", "typescript"]`, `["react", "ai"]`, and `[]`
- **THEN** the response SHALL be `["ai", "react", "typescript"]` (deduplicated, alphabetically sorted)

#### Scenario: User with no bookmarks
- **WHEN** an authenticated user requests `GET /api/v1/tags` and they have no bookmarks
- **THEN** the response SHALL be `[]`

#### Scenario: User with bookmarks but no tags
- **WHEN** an authenticated user requests `GET /api/v1/tags` and all their bookmarks have empty tag arrays
- **THEN** the response SHALL be `[]`

#### Scenario: Unauthenticated request
- **WHEN** an unauthenticated request is made to `GET /api/v1/tags`
- **THEN** the response SHALL be `401 Unauthorized`

### Requirement: useTags hook fetches tags
The frontend SHALL provide a `useTags()` React Query hook that fetches from `GET /api/v1/tags` and returns `string[]`.

#### Scenario: Successful fetch
- **WHEN** `useTags()` is called
- **THEN** it SHALL return `{ data: string[], isLoading, error }` from a React Query `useQuery` call

#### Scenario: Cache key isolation
- **WHEN** `useTags()` is used
- **THEN** it SHALL use a distinct query key (e.g., `["tags"]`) so it is cached independently from bookmark queries

#### Scenario: Refetch on bookmark mutation
- **WHEN** a bookmark is created, updated, or deleted (since tags may change)
- **THEN** the tags query SHALL be invalidated so the tag list stays current
