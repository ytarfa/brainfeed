## ADDED Requirements

### Requirement: Modal shell delegates content to resolved detail view
The `BookmarkDetail.tsx` component SHALL act as a modal shell only — managing overlay, open/close animation, escape key, close button, and dialog ARIA attributes. It SHALL delegate the entire scrollable body content to a detail view component resolved from the registry.

#### Scenario: Modal renders correct view for GitHub bookmark
- **WHEN** a bookmark with `content_type: "link"` and `source_type: "github"` is opened
- **THEN** the modal shell renders `GitHubDetailView` inside its scrollable body

#### Scenario: Modal renders correct view for unknown source type
- **WHEN** a bookmark with `content_type: "link"` and `source_type: null` is opened
- **THEN** the modal shell renders `DefaultDetailView` as fallback

#### Scenario: Modal renders view for non-link content type (future)
- **WHEN** a bookmark with `content_type: "note"` is opened
- **THEN** the modal shell resolves the view by `content_type` alone, ignoring `source_type`

### Requirement: Composite key resolution for detail views
The registry SHALL resolve detail views using a two-level key: for `content_type: "link"`, the key is `link:<source_type>` (e.g., `link:github`). For other content types, the key is the `content_type` directly (e.g., `note`, `pdf`). If `source_type` is null for links, the key falls back to `link:generic`.

#### Scenario: Resolution for link with source type
- **WHEN** a bookmark has `content_type: "link"` and `source_type: "youtube"`
- **THEN** the resolved key is `link:youtube`

#### Scenario: Resolution for link with null source type
- **WHEN** a bookmark has `content_type: "link"` and `source_type: null`
- **THEN** the resolved key is `link:generic`

#### Scenario: Resolution for non-link content type
- **WHEN** a bookmark has `content_type: "note"`
- **THEN** the resolved key is `note`

#### Scenario: Fallback for unregistered key
- **WHEN** the resolved key has no registered component
- **THEN** the registry SHALL return `DefaultDetailView`

### Requirement: Detail view props contract
All detail view components SHALL accept `DetailViewProps`:
- `bookmark: Bookmark` (required)
- `spaceName?: string` (optional)
- `spaceColor?: string` (optional)

Detail views SHALL NOT receive modal-level props (onClose, animation state). Detail views SHALL NOT manage modal behavior.

#### Scenario: View receives bookmark data
- **WHEN** a detail view component is rendered
- **THEN** it receives the full `Bookmark` object, optional space name, and optional space color

### Requirement: Shared building block components
Reusable sections (summary, tags, notes, space, footer, topics, entities, metadata) SHALL be extracted into shared components under `detailViews/shared/`. Each shared component SHALL be independently importable and composable. Per-type views SHALL opt-in to shared components — they are not imposed.

#### Scenario: View uses shared summary component
- **WHEN** a detail view wants to display the AI summary section
- **THEN** it imports and renders `DetailSummary` with the bookmark's enrichment data

#### Scenario: View skips shared component
- **WHEN** a detail view does not need the generic metadata chips (e.g., GitHub renders metadata in its own structured header)
- **THEN** it simply does not import `DetailMetadata` — no error, no empty section

### Requirement: MediaItem type on EnrichedData
The `EnrichedData` interface SHALL include an optional `media?: MediaItem[]` field. `MediaItem` SHALL have: `url: string`, `type: "image" | "video"`, and `alt?: string`. This field is not populated by the current enrichment pipeline but views MAY read it for future multi-media rendering.

#### Scenario: EnrichedData with no media field
- **WHEN** `enriched_data.media` is undefined or empty
- **THEN** views that support media SHALL fall back to `thumbnail_url`

#### Scenario: EnrichedData with media array
- **WHEN** `enriched_data.media` contains items
- **THEN** views MAY render them (e.g., Instagram carousel)

### Requirement: Mock data reflects real enrichment pipeline keys
Mock data in `apps/frontend/src/data/mock.ts` SHALL use metadata keys that match the actual enrichment pipeline output (e.g., `channelTitle` not `channel`, `viewCount` not `views`). Mock data SHALL include discriminator keys (e.g., `githubType`, `videoId`, `instagramType`) that the real pipeline produces.

#### Scenario: GitHub mock uses correct keys
- **WHEN** rendering a GitHub repo mock bookmark
- **THEN** `enriched_data.metadata` includes `githubType: "repo"`, `owner`, `repo`, `stars`, `forks`, `language`

#### Scenario: YouTube mock uses correct keys
- **WHEN** rendering a YouTube video mock bookmark
- **THEN** `enriched_data.metadata` includes `videoId`, `channelTitle`, `viewCount`, `duration`, `durationSeconds`
