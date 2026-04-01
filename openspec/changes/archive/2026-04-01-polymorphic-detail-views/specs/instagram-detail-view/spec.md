## ADDED Requirements

### Requirement: Instagram detail view renders large image display
The Instagram detail view SHALL render the bookmark image at a significantly larger size than the default hero (occupying approximately 60-70% of the modal viewport). The image presentation SHALL be the dominant visual element.

#### Scenario: Post with thumbnail_url only
- **WHEN** an Instagram bookmark has `thumbnail_url` but no `enriched_data.media` array
- **THEN** the view renders `thumbnail_url` as a large, centered image

#### Scenario: Post with media array (future)
- **WHEN** an Instagram bookmark has `enriched_data.media` with multiple items
- **THEN** the view renders a carousel with dot indicators and navigation arrows, displaying one image at a time

#### Scenario: Post with no image at all
- **WHEN** an Instagram bookmark has neither `thumbnail_url` nor `enriched_data.media`
- **THEN** the view renders a styled placeholder appropriate for Instagram content

### Requirement: Instagram detail view distinguishes post vs reel
The view SHALL render differently based on `enriched_data.metadata.instagramType`:
- Posts emphasize the image/carousel
- Reels indicate video content with appropriate visual treatment

#### Scenario: Instagram post
- **WHEN** `instagramType` is `"post"` and `mediaType` is `"image"` or `"carousel"`
- **THEN** the view renders the image-centric layout

#### Scenario: Instagram reel
- **WHEN** `instagramType` is `"reel"` or `mediaType` is `"video"`
- **THEN** the view renders a video-style indicator (e.g., play icon overlay) on the thumbnail

### Requirement: Instagram detail view shows username and caption
The view SHALL display the Instagram username (from `enriched_data.metadata.username`) prominently, styled as `@username`. The bookmark description or caption SHALL be displayed below the image in a style distinct from article body text.

#### Scenario: Post with username
- **WHEN** an Instagram bookmark has `metadata.username`
- **THEN** the view renders `@username` below the image, before the caption

#### Scenario: Post without username
- **WHEN** an Instagram bookmark has no `metadata.username`
- **THEN** the view omits the username line without layout breakage

### Requirement: Instagram carousel component is navigation-ready
The carousel component SHALL support:
- Dot indicators showing current position and total count
- Left/right navigation (arrows or swipe)
- Single-image graceful degradation (no dots, no arrows when only one image)

#### Scenario: Single image in media array
- **WHEN** `enriched_data.media` has exactly one item
- **THEN** the carousel renders the image without navigation controls

#### Scenario: Multiple images in media array
- **WHEN** `enriched_data.media` has multiple items
- **THEN** the carousel renders dot indicators and arrow navigation

### Requirement: Instagram detail view composes shared building blocks
The Instagram detail view SHALL use shared components for AI summary, tags, notes, and space. It MAY omit `DetailFooter` if it provides its own "Open on Instagram" link with Instagram-specific styling.

#### Scenario: Instagram view with enriched summary
- **WHEN** an Instagram bookmark has enriched_data with a summary
- **THEN** the view renders `DetailSummary` from shared components
