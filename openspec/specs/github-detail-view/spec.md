## ADDED Requirements

### Requirement: GitHub detail view renders structured repository header
When the bookmark is a GitHub repository (`enriched_data.metadata.githubType === "repo"`), the view SHALL display a structured header with owner/repo identity, star count, fork count, and primary language as first-class styled elements — not as generic metadata chips.

#### Scenario: Repository with full metadata
- **WHEN** a GitHub repo bookmark has metadata with `stars`, `forks`, and `language`
- **THEN** the view renders a header showing `owner/repo`, formatted star count, formatted fork count, and language with appropriate styling

#### Scenario: Repository with partial metadata
- **WHEN** a GitHub repo bookmark has metadata missing `language` or `license`
- **THEN** the view renders available metadata and gracefully omits missing fields

### Requirement: GitHub detail view renders issue-specific layout
When the bookmark is a GitHub issue (`enriched_data.metadata.githubType === "issue"`), the view SHALL display issue number, state (open/closed), author, and comment count as first-class elements.

#### Scenario: Open issue with labels
- **WHEN** a GitHub issue bookmark has `state: "open"` and `labels` present
- **THEN** the view renders the issue number, an "open" state indicator, author, and labels as colored pills

#### Scenario: Closed issue
- **WHEN** a GitHub issue bookmark has `state: "closed"`
- **THEN** the view renders a "closed" state indicator with distinct styling from "open"

### Requirement: GitHub detail view renders PR-specific layout
When the bookmark is a GitHub pull request (`enriched_data.metadata.githubType === "pr"`), the view SHALL display PR number, state, merge status, author, and diff stats (additions/deletions/changed files) as first-class elements.

#### Scenario: Merged PR
- **WHEN** a GitHub PR bookmark has `merged: "true"`
- **THEN** the view renders a "merged" indicator with distinct styling

#### Scenario: Open PR with diff stats
- **WHEN** a GitHub PR bookmark has `additions`, `deletions`, and `changedFiles`
- **THEN** the view renders formatted diff stats (e.g., "+1,234 / -567 across 42 files")

### Requirement: GitHub detail view uses no hero image
The GitHub detail view SHALL NOT render a hero image or `ThumbnailPlaceholder`. The structured header with repository/issue/PR identity replaces the hero section.

#### Scenario: GitHub bookmark with thumbnail_url
- **WHEN** a GitHub bookmark has a non-null `thumbnail_url`
- **THEN** the view does NOT render it as a hero image (the GitHub opengraph image is not useful as a visual hero)

### Requirement: GitHub detail view composes shared building blocks
The GitHub detail view SHALL use shared components for AI summary, tags, notes, space, and footer sections. It SHALL NOT use the generic `DetailMetadata` component for repository stats.

#### Scenario: GitHub view renders summary and footer
- **WHEN** a GitHub bookmark has enriched_data with a summary
- **THEN** the view renders `DetailSummary` and `DetailFooter` from shared components
