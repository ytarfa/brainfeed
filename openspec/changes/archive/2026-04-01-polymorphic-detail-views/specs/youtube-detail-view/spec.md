## ADDED Requirements

### Requirement: YouTube detail view renders video-specific layout
When the bookmark is a YouTube video (`enriched_data.metadata.videoId` is present), the view SHALL display a styled video thumbnail with a play indicator overlay, and render duration, channel name, and view count as first-class styled metadata — not as generic chips.

#### Scenario: Video with full metadata
- **WHEN** a YouTube video bookmark has `thumbnail_url`, `duration`, `channelTitle`, and `viewCount`
- **THEN** the view renders a large thumbnail with centered play icon overlay, and below it shows title, channel name, formatted view count, and duration

#### Scenario: Video without thumbnail
- **WHEN** a YouTube video bookmark has no `thumbnail_url`
- **THEN** the view renders a `ThumbnailPlaceholder` styled for YouTube with a play indicator

#### Scenario: Video with missing metadata fields
- **WHEN** a YouTube video bookmark is missing `channelTitle` or `viewCount`
- **THEN** the view gracefully omits those fields without layout breakage

### Requirement: YouTube detail view renders channel-specific layout
When the bookmark is a YouTube channel (`enriched_data.metadata.channelId` is present), the view SHALL display channel identity with subscriber count and video count as first-class elements.

#### Scenario: Channel with subscriber data
- **WHEN** a YouTube channel bookmark has `channelTitle`, `subscriberCount`, and `videoCount`
- **THEN** the view renders channel name, formatted subscriber count, and video count

### Requirement: YouTube detail view renders playlist-specific layout
When the bookmark is a YouTube playlist (`enriched_data.metadata.playlistId` is present), the view SHALL display playlist title, item count, and channel name as first-class elements.

#### Scenario: Playlist with metadata
- **WHEN** a YouTube playlist bookmark has `title`, `itemCount`, and `channelTitle`
- **THEN** the view renders playlist title, item count, and channel attribution

### Requirement: YouTube thumbnail links to source
The YouTube video thumbnail SHALL be clickable and link to the original YouTube URL. It SHALL NOT embed an iframe player.

#### Scenario: User clicks video thumbnail
- **WHEN** user clicks the thumbnail area of a YouTube video bookmark
- **THEN** the original YouTube URL opens in a new tab

### Requirement: YouTube detail view composes shared building blocks
The YouTube detail view SHALL use shared components for AI summary, tags, notes, space, and footer sections.

#### Scenario: YouTube view with enriched summary
- **WHEN** a YouTube bookmark has enriched_data with a summary
- **THEN** the view renders `DetailSummary` and `DetailFooter` from shared components
