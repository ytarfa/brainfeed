## Requirements

### Requirement: Inline thumbnail resolution for link bookmarks
The system SHALL resolve a `thumbnail_url` synchronously during bookmark creation for bookmarks with `content_type: "link"` and a non-null `url`. Resolution SHALL occur as part of the `UrlHandlerRegistry.resolve()` call, which fetches OG metadata and applies handler-specific overrides. The `thumbnailUrl` field of the returned `ResolvedBookmark` SHALL be used for `thumbnail_url`. If resolution fails or no thumbnail is found, the bookmark SHALL be created with `thumbnail_url = NULL`. Resolution errors SHALL be logged but SHALL NOT cause the bookmark creation request to fail.

#### Scenario: Bookmark created with resolved thumbnail
- **WHEN** a user creates a bookmark with `content_type: "link"` and a URL that has a discoverable thumbnail
- **THEN** the bookmark is created with `thumbnail_url` populated and returned in the response

#### Scenario: Bookmark created when thumbnail resolution fails
- **WHEN** a user creates a bookmark with `content_type: "link"` and the target URL is unreachable or has no thumbnail
- **THEN** the bookmark is created with `thumbnail_url = NULL` and the response is successful

#### Scenario: Non-link content types skip thumbnail resolution
- **WHEN** a user creates a bookmark with `content_type` of `"note"`, `"image"`, `"pdf"`, or `"file"`
- **THEN** no thumbnail resolution is attempted and `thumbnail_url` remains NULL

### Requirement: YouTube thumbnail resolution by URL construction
The system SHALL resolve YouTube video thumbnails via the `YouTubeHandler.resolve()` method, which extracts the video ID from the URL and returns `{ thumbnailUrl: "https://img.youtube.com/vi/{videoId}/hqdefault.jpg" }`. This SHALL NOT require an additional HTTP request beyond the OG fetch. The system SHALL support URLs matching `youtube.com/watch?v=`, `youtu.be/`, and `youtube.com/embed/` patterns.

#### Scenario: Standard YouTube URL
- **WHEN** the URL handler registry resolves a YouTube URL `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- **THEN** the `ResolvedBookmark.thumbnailUrl` is `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg`

#### Scenario: Short YouTube URL
- **WHEN** the URL handler registry resolves URL `https://youtu.be/dQw4w9WgXcQ`
- **THEN** the `ResolvedBookmark.thumbnailUrl` is `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg`

#### Scenario: YouTube embed URL
- **WHEN** the URL handler registry resolves URL `https://www.youtube.com/embed/dQw4w9WgXcQ`
- **THEN** the `ResolvedBookmark.thumbnailUrl` is `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg`

#### Scenario: Unrecognized YouTube URL pattern
- **WHEN** the URL handler registry resolves a YouTube URL but the video ID cannot be extracted
- **THEN** `ResolvedBookmark.thumbnailUrl` falls back to the OG image from the base layer

### Requirement: GitHub thumbnail resolution by URL construction
The system SHALL resolve GitHub repository thumbnails via the `GitHubHandler.resolve()` method, which extracts the owner and repository name from the URL and returns `{ thumbnailUrl: "https://opengraph.githubassets.com/1/{owner}/{repo}" }`. This SHALL NOT require an additional HTTP request beyond the OG fetch. The system SHALL support URLs matching `github.com/{owner}/{repo}` patterns.

#### Scenario: GitHub repository URL
- **WHEN** the URL handler registry resolves URL `https://github.com/facebook/react`
- **THEN** the `ResolvedBookmark.thumbnailUrl` is `https://opengraph.githubassets.com/1/facebook/react`

#### Scenario: GitHub deep URL (file, issue, PR)
- **WHEN** the URL handler registry resolves URL `https://github.com/facebook/react/issues/123`
- **THEN** the `ResolvedBookmark.thumbnailUrl` is `https://opengraph.githubassets.com/1/facebook/react`

#### Scenario: Unrecognized GitHub URL pattern
- **WHEN** the URL handler registry resolves a GitHub URL but owner/repo cannot be extracted
- **THEN** `ResolvedBookmark.thumbnailUrl` falls back to the OG image from the base layer
