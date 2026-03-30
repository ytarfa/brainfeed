## ADDED Requirements

### Requirement: YouTube URL classification

The enrichment pipeline SHALL classify YouTube URLs into exactly three types: `"video"`, `"channel"`, or `"playlist"`. Classification SHALL be performed by a `classifyYouTubeUrl(url: string)` function in `YouTubeService`.

#### Scenario: Video URL with watch parameter
- **WHEN** the URL contains `/watch?v=` or matches `youtu.be/<id>`
- **THEN** it SHALL be classified as `"video"` and the video ID SHALL be extracted

#### Scenario: Video URL with both video and playlist parameters
- **WHEN** the URL contains `/watch?v=abc&list=xyz`
- **THEN** it SHALL be classified as `"video"` (not `"playlist"`)

#### Scenario: Shorts URL
- **WHEN** the URL contains `/shorts/<id>`
- **THEN** it SHALL be classified as `"video"` and the video ID SHALL be extracted

#### Scenario: Embed URL
- **WHEN** the URL contains `/embed/<id>`
- **THEN** it SHALL be classified as `"video"` and the video ID SHALL be extracted

#### Scenario: Channel URL with handle
- **WHEN** the URL contains `/@<handle>`
- **THEN** it SHALL be classified as `"channel"` and the handle SHALL be extracted

#### Scenario: Channel URL with channel ID
- **WHEN** the URL contains `/channel/<channelId>`
- **THEN** it SHALL be classified as `"channel"` and the channel ID SHALL be extracted

#### Scenario: Channel URL with custom path
- **WHEN** the URL contains `/c/<customName>` or `/user/<username>`
- **THEN** it SHALL be classified as `"channel"` and the custom name or username SHALL be extracted

#### Scenario: Playlist URL
- **WHEN** the URL contains `/playlist?list=<playlistId>`
- **THEN** it SHALL be classified as `"playlist"` and the playlist ID SHALL be extracted

#### Scenario: Unrecognized YouTube URL
- **WHEN** the URL is on a YouTube domain but does not match any known pattern
- **THEN** it SHALL be classified as `"video"` as a fallback, and the node SHALL attempt best-effort enrichment from the page title and URL

### Requirement: Video transcript loading

The YouTube enrichment node SHALL load video transcripts using `YoutubeLoader` from `@langchain/community`. The transcript SHALL be used as the primary content source for LLM summarization.

#### Scenario: Successful transcript load
- **WHEN** a video URL is processed and captions are available
- **THEN** the node SHALL load the English transcript and pass it to the LLM for enrichment

#### Scenario: Transcript unavailable
- **WHEN** transcript loading fails (disabled captions, private video, network error)
- **THEN** the node SHALL fall back to enriching from the video title and description only, and SHALL set `metadata.transcriptAvailable` to `"false"`

#### Scenario: Transcript truncation
- **WHEN** the loaded transcript exceeds the configured maximum character limit
- **THEN** the transcript SHALL be truncated to the limit before being sent to the LLM

### Requirement: Video metadata enrichment

The YouTube enrichment node SHALL fetch video metadata via the YouTube Data API (`YouTubeService.getVideo()`) and include structured metadata in the `EnrichedData.metadata` field.

#### Scenario: Video metadata fields
- **WHEN** a video is successfully enriched
- **THEN** `metadata` SHALL include: `youtubeType` (`"video"`), `videoId`, `channelTitle`, `duration`, `viewCount`, `likeCount`, `publishedAt`, and `transcriptAvailable` (`"true"` or `"false"`)

#### Scenario: Video API call failure
- **WHEN** the YouTube Data API call fails for a video
- **THEN** the node SHALL still attempt enrichment using whatever content is available (transcript, bookmark title) and set metadata to contain only `youtubeType` and `videoId`

### Requirement: Channel metadata enrichment

The YouTube enrichment node SHALL fetch channel metadata via the YouTube Data API and produce enrichment from the channel title, description, and statistics.

#### Scenario: Channel resolved by handle
- **WHEN** a channel URL contains `/@handle`
- **THEN** the node SHALL resolve the handle to a channel ID using the YouTube Data API `forHandle` parameter, then fetch full channel metadata

#### Scenario: Channel resolved by ID
- **WHEN** a channel URL contains `/channel/<channelId>`
- **THEN** the node SHALL fetch channel metadata directly using the channel ID

#### Scenario: Channel metadata fields
- **WHEN** a channel is successfully enriched
- **THEN** `metadata` SHALL include: `youtubeType` (`"channel"`), `channelId`, `subscriberCount`, `videoCount`, `viewCount`, and `publishedAt`

#### Scenario: Channel handle resolution failure
- **WHEN** the `forHandle` API call returns no results for a handle
- **THEN** the node SHALL return enrichment with `summary: null` and metadata containing only `youtubeType` (`"channel"`) and the original handle

### Requirement: Playlist metadata enrichment

The YouTube enrichment node SHALL fetch playlist metadata and playlist item titles via the YouTube Data API and produce enrichment from the combined content.

#### Scenario: Playlist metadata and items fetched
- **WHEN** a playlist URL is processed
- **THEN** the node SHALL fetch the playlist title, description, and item count, plus the titles of up to the first 50 videos in the playlist

#### Scenario: Playlist metadata fields
- **WHEN** a playlist is successfully enriched
- **THEN** `metadata` SHALL include: `youtubeType` (`"playlist"`), `playlistId`, `itemCount`, and `channelTitle`

#### Scenario: Playlist API call failure
- **WHEN** the YouTube Data API call fails for a playlist
- **THEN** the node SHALL return enrichment with `summary: null` and metadata containing only `youtubeType` (`"playlist"`) and `playlistId`

### Requirement: YouTubeService playlist support

`YouTubeService` SHALL be extended with methods and types for fetching playlist data from the YouTube Data API.

#### Scenario: Get playlist metadata
- **WHEN** `getPlaylist(id)` is called with a valid playlist ID
- **THEN** it SHALL return playlist snippet (title, description, channelTitle, publishedAt) and contentDetails (itemCount) from the YouTube Data API `/playlists` endpoint

#### Scenario: Get playlist items
- **WHEN** `getPlaylistItems(playlistId, maxResults?)` is called
- **THEN** it SHALL return up to `maxResults` (default 50) items from the YouTube Data API `/playlistItems` endpoint, including each item's video title and video ID

### Requirement: YouTubeService channel handle resolution

`YouTubeService` SHALL support resolving channel handles to channel IDs.

#### Scenario: Resolve channel by handle
- **WHEN** `getChannelByHandle(handle)` is called with a handle string (without the `@` prefix)
- **THEN** it SHALL call the YouTube Data API channels endpoint with the `forHandle` parameter and return the channel resource
