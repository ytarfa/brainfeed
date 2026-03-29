## ADDED Requirements

### Requirement: Inline thumbnail resolution for link bookmarks
The system SHALL resolve a `thumbnail_url` synchronously during bookmark creation for bookmarks with `content_type: "link"` and a non-null `url`. Resolution SHALL occur after source type detection and before the database INSERT. If resolution fails or no thumbnail is found, the bookmark SHALL be created with `thumbnail_url = NULL`. Resolution errors SHALL be logged but SHALL NOT cause the bookmark creation request to fail.

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
The system SHALL resolve YouTube video thumbnails by extracting the video ID from the URL and constructing `https://img.youtube.com/vi/{videoId}/hqdefault.jpg`. This SHALL NOT require an HTTP request to the target URL. The system SHALL support URLs matching `youtube.com/watch?v=`, `youtu.be/`, and `youtube.com/embed/` patterns.

#### Scenario: Standard YouTube URL
- **WHEN** thumbnail resolution is invoked for a bookmark with `source_type: "youtube"` and URL `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- **THEN** the resolved thumbnail URL is `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg`

#### Scenario: Short YouTube URL
- **WHEN** thumbnail resolution is invoked for a bookmark with URL `https://youtu.be/dQw4w9WgXcQ`
- **THEN** the resolved thumbnail URL is `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg`

#### Scenario: YouTube embed URL
- **WHEN** thumbnail resolution is invoked for a bookmark with URL `https://www.youtube.com/embed/dQw4w9WgXcQ`
- **THEN** the resolved thumbnail URL is `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg`

#### Scenario: Unrecognized YouTube URL pattern
- **WHEN** thumbnail resolution is invoked for a bookmark with `source_type: "youtube"` but the video ID cannot be extracted
- **THEN** resolution falls back to generic OG image fetch

### Requirement: GitHub thumbnail resolution by URL construction
The system SHALL resolve GitHub repository thumbnails by extracting the owner and repository name from the URL and constructing `https://opengraph.githubassets.com/1/{owner}/{repo}`. This SHALL NOT require an HTTP request to the target URL. The system SHALL support URLs matching `github.com/{owner}/{repo}` patterns.

#### Scenario: GitHub repository URL
- **WHEN** thumbnail resolution is invoked for a bookmark with `source_type: "github"` and URL `https://github.com/facebook/react`
- **THEN** the resolved thumbnail URL is `https://opengraph.githubassets.com/1/facebook/react`

#### Scenario: GitHub deep URL (file, issue, PR)
- **WHEN** thumbnail resolution is invoked for a bookmark with `source_type: "github"` and URL `https://github.com/facebook/react/issues/123`
- **THEN** the resolved thumbnail URL is `https://opengraph.githubassets.com/1/facebook/react`

#### Scenario: Unrecognized GitHub URL pattern
- **WHEN** thumbnail resolution is invoked for a bookmark with `source_type: "github"` but owner/repo cannot be extracted
- **THEN** resolution falls back to generic OG image fetch

### Requirement: Generic OG image resolution via HTML fetch and parse
The system SHALL resolve thumbnails for all other source types by fetching the bookmark URL via HTTP GET, parsing the HTML response with cheerio, and extracting the `content` attribute of the first `<meta>` tag matching `property="og:image"` or `name="og:image"`. The HTTP request SHALL use a 5-second timeout via AbortController. If the fetch fails, times out, returns a non-HTML response, or no `og:image` meta tag is found, resolution SHALL return NULL.

#### Scenario: Page with og:image meta tag
- **WHEN** thumbnail resolution fetches a URL that returns HTML containing `<meta property="og:image" content="https://example.com/img.jpg">`
- **THEN** the resolved thumbnail URL is `https://example.com/img.jpg`

#### Scenario: Page without og:image
- **WHEN** thumbnail resolution fetches a URL that returns HTML with no `og:image` meta tag
- **THEN** resolution returns NULL

#### Scenario: Fetch timeout
- **WHEN** thumbnail resolution fetches a URL and the server does not respond within 5 seconds
- **THEN** the request is aborted and resolution returns NULL

#### Scenario: Non-HTML response
- **WHEN** thumbnail resolution fetches a URL that returns a non-HTML content type (e.g., application/json, application/pdf)
- **THEN** resolution returns NULL

#### Scenario: Network error
- **WHEN** thumbnail resolution fetches a URL and the request fails due to DNS resolution, connection refused, or other network error
- **THEN** resolution returns NULL

### Requirement: Thumbnail resolution function architecture
The system SHALL implement thumbnail resolution as a `resolveThumbnail(url: string, sourceType: string): Promise<string | null>` function in a dedicated service module. This function SHALL dispatch to platform-specific resolvers based on `sourceType` and fall back to the generic OG image resolver. The function SHALL be importable and callable from any route handler.

#### Scenario: Dispatch to YouTube resolver
- **WHEN** `resolveThumbnail` is called with `sourceType: "youtube"`
- **THEN** the YouTube URL construction strategy is used

#### Scenario: Dispatch to GitHub resolver
- **WHEN** `resolveThumbnail` is called with `sourceType: "github"`
- **THEN** the GitHub URL construction strategy is used

#### Scenario: Dispatch to generic resolver
- **WHEN** `resolveThumbnail` is called with `sourceType: "reddit"` or any non-YouTube, non-GitHub source type
- **THEN** the generic OG image fetch/parse strategy is used

#### Scenario: Null URL handling
- **WHEN** `resolveThumbnail` is called with a null or empty URL
- **THEN** the function returns NULL without attempting resolution
