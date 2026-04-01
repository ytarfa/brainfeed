## ADDED Requirements

### Requirement: Article detail view emphasizes author and reading time
The Article detail view SHALL render author name (from `enriched_data.metadata.author`), publication/site name (from `enriched_data.metadata.siteName`), and reading time (from `enriched_data.metadata.readingTimeMinutes`) as first-class styled elements in the title area — not as generic metadata chips.

#### Scenario: Article with full metadata
- **WHEN** an article bookmark has `author`, `siteName`, and `readingTimeMinutes` in metadata
- **THEN** the view renders a subtitle line like "publication.com · by Author Name · 8 min read"

#### Scenario: Article with partial metadata
- **WHEN** an article bookmark is missing `author` or `readingTimeMinutes`
- **THEN** the view renders available fields and gracefully omits missing ones

### Requirement: Article detail view retains hero image
The Article detail view SHALL render a hero image from `thumbnail_url` (or `enriched_data.metadata.ogImage` as fallback) when available. If no image exists, it SHALL render a `ThumbnailPlaceholder`.

#### Scenario: Article with thumbnail
- **WHEN** an article bookmark has `thumbnail_url`
- **THEN** the view renders an edge-to-edge hero image similar to the current default layout

#### Scenario: Article with ogImage but no thumbnail
- **WHEN** an article bookmark has `enriched_data.metadata.ogImage` but no `thumbnail_url`
- **THEN** the view renders the ogImage as the hero image

#### Scenario: Article with no image
- **WHEN** an article bookmark has neither `thumbnail_url` nor `ogImage`
- **THEN** the view renders a `ThumbnailPlaceholder`

### Requirement: Article detail view shows word count context
When `enriched_data.metadata.wordCount` is available, the view SHALL display it as supplementary context (e.g., as part of the reading time display or as a subtle metadata element).

#### Scenario: Article with word count
- **WHEN** an article bookmark has `wordCount: 2400` and `readingTimeMinutes: 11`
- **THEN** the view renders reading time and may include word count as supplementary detail

### Requirement: Article detail view composes shared building blocks
The Article detail view SHALL use shared components for AI summary, topics, entities, tags, notes, space, and footer sections.

#### Scenario: Article view renders all shared sections
- **WHEN** an article bookmark has enriched_data with summary, topics, entities, and tags
- **THEN** the view renders all corresponding shared components in a logical reading order
