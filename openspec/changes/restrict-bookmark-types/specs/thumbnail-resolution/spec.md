## MODIFIED Requirements

### Requirement: Inline thumbnail resolution for link bookmarks
The system SHALL resolve a `thumbnail_url` synchronously during bookmark creation for all bookmarks (which are always `content_type: "link"` with a non-null `url`). Resolution SHALL occur after source type detection and before the database INSERT. If resolution fails or no thumbnail is found, the bookmark SHALL be created with `thumbnail_url = NULL`. Resolution errors SHALL be logged but SHALL NOT cause the bookmark creation request to fail.

#### Scenario: Bookmark created with resolved thumbnail
- **WHEN** a user creates a bookmark with a URL that has a discoverable thumbnail
- **THEN** the bookmark is created with `thumbnail_url` populated and returned in the response

#### Scenario: Bookmark created when thumbnail resolution fails
- **WHEN** a user creates a bookmark and the target URL is unreachable or has no thumbnail
- **THEN** the bookmark is created with `thumbnail_url = NULL` and the response is successful

### Requirement: Source type detection
The system SHALL detect source type from the bookmark URL using a hostname lookup. The `SOURCE_TYPE_MAP` SHALL contain exactly two entries: `github.com` → `"github"` and `youtube.com`/`youtu.be` → `"youtube"`. All other URLs SHALL resolve to `"generic"`. The `SourceType` type SHALL be `"github" | "youtube" | "generic"`.

#### Scenario: GitHub URL detection
- **WHEN** a bookmark is created with a URL containing hostname `github.com`
- **THEN** `source_type` SHALL be set to `"github"`

#### Scenario: YouTube URL detection
- **WHEN** a bookmark is created with a URL containing hostname `youtube.com` or `youtu.be`
- **THEN** `source_type` SHALL be set to `"youtube"`

#### Scenario: Unknown URL detection
- **WHEN** a bookmark is created with a URL not matching any known hostname
- **THEN** `source_type` SHALL be set to `"generic"`

### Requirement: Thumbnail resolution function architecture
The system SHALL implement thumbnail resolution as a `resolveThumbnail(url: string, sourceType: string): Promise<string | null>` function in a dedicated service module. This function SHALL dispatch to platform-specific resolvers based on `sourceType` and fall back to the generic OG image resolver. The function SHALL be importable and callable from any route handler.

#### Scenario: Dispatch to YouTube resolver
- **WHEN** `resolveThumbnail` is called with `sourceType: "youtube"`
- **THEN** the YouTube URL construction strategy is used

#### Scenario: Dispatch to GitHub resolver
- **WHEN** `resolveThumbnail` is called with `sourceType: "github"`
- **THEN** the GitHub URL construction strategy is used

#### Scenario: Dispatch to generic resolver
- **WHEN** `resolveThumbnail` is called with `sourceType: "generic"` or any non-YouTube, non-GitHub source type
- **THEN** the generic OG image fetch/parse strategy is used

#### Scenario: Null URL handling
- **WHEN** `resolveThumbnail` is called with a null or empty URL
- **THEN** the function returns NULL without attempting resolution

## REMOVED Requirements

### Requirement: Non-link content types skip thumbnail resolution
**Reason**: `content_type` is restricted to `"link"` only. There are no non-link content types to skip.
**Migration**: None needed. All bookmarks are links and always attempt thumbnail resolution.
