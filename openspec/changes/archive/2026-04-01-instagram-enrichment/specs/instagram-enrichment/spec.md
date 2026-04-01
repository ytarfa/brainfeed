## Purpose

Instagram enrichment capability — extracts content and metadata from Instagram post and reel URLs via SSR HTML parsing, and enriches bookmarks via LLM summarization.

## Requirements

### Requirement: Instagram URL classification

The `InstagramService` SHALL classify Instagram URLs into content sub-types based on URL path patterns.

#### Scenario: Post URL classification
- **WHEN** the URL path matches `/p/{shortcode}/` or `/p/{shortcode}`
- **THEN** the classifier SHALL return `instagramType: "post"` with the extracted shortcode

#### Scenario: Reel URL classification
- **WHEN** the URL path matches `/reel/{shortcode}/`, `/reel/{shortcode}`, `/reels/{shortcode}/`, or `/reels/{shortcode}`
- **THEN** the classifier SHALL return `instagramType: "reel"` with the extracted shortcode

#### Scenario: IGTV URL classification
- **WHEN** the URL path matches `/tv/{shortcode}/` or `/tv/{shortcode}`
- **THEN** the classifier SHALL return `instagramType: "reel"` with the extracted shortcode (IGTV is treated as reel)

#### Scenario: Unrecognized Instagram URL
- **WHEN** the URL is on an Instagram hostname but the path does not match any known post/reel pattern (e.g., profile URLs, story URLs, explore pages)
- **THEN** the classifier SHALL return `null`

### Requirement: Instagram SSR HTML fetching

The `InstagramService` SHALL fetch Instagram pages using a Googlebot User-Agent to maximize the chance of receiving SSR-rendered HTML with embedded content data.

#### Scenario: Successful SSR fetch
- **WHEN** `InstagramService` fetches an Instagram URL and receives SSR-rendered HTML containing embedded caption data
- **THEN** it SHALL proceed to extract content from the HTML body

#### Scenario: Empty JS shell response
- **WHEN** `InstagramService` fetches an Instagram URL and receives only a client-side-rendered JS shell (no embedded caption data)
- **THEN** it SHALL throw an error indicating that SSR data is not available

#### Scenario: User-Agent header
- **WHEN** fetching an Instagram page
- **THEN** the service SHALL use a Googlebot User-Agent string: `Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`

#### Scenario: Fetch timeout
- **WHEN** the HTTP request to Instagram exceeds 30 seconds
- **THEN** the service SHALL abort the request and throw a timeout error

#### Scenario: Fetch failure
- **WHEN** the HTTP fetch fails (network error, non-2xx status)
- **THEN** the service SHALL throw an error that the Instagram graph node can catch

### Requirement: Instagram SSR HTML content extraction

The `InstagramService` SHALL parse SSR-rendered Instagram HTML to extract caption text, media metadata, and author information from embedded JSON structures.

#### Scenario: Caption text extraction
- **WHEN** the SSR HTML contains embedded JSON with `"caption":{"text":"..."}` structures
- **THEN** the service SHALL extract the caption text from the first caption object found that corresponds to the bookmarked post

#### Scenario: Media type extraction
- **WHEN** the SSR HTML contains a `"media_type"` field in embedded JSON
- **THEN** the service SHALL map the integer value to a human-readable type: `1` → `"image"`, `2` → `"video"`, `8` → `"carousel"`

#### Scenario: Carousel metadata extraction
- **WHEN** the media type is `8` (carousel) and `"carousel_media_count"` is present in the embedded JSON
- **THEN** the service SHALL extract the carousel slide count

#### Scenario: Accessibility caption extraction
- **WHEN** the SSR HTML contains `"accessibility_caption"` fields
- **THEN** the service SHALL extract the accessibility caption (AI-generated image description) to supplement the caption text for LLM enrichment

#### Scenario: Author information extraction
- **WHEN** the SSR HTML contains `"username"` and `"full_name"` fields in embedded JSON
- **THEN** the service SHALL extract both the username and display name

#### Scenario: Thumbnail extraction from OG image
- **WHEN** the SSR HTML contains an `og:image` meta tag
- **THEN** the service SHALL extract the image URL for use as the bookmark thumbnail

#### Scenario: No extractable caption
- **WHEN** the SSR HTML does not contain any `"caption":{"text":"..."}` structures or the caption text is empty
- **THEN** the service SHALL throw an error indicating insufficient data for enrichment

### Requirement: Instagram enrichment graph node

The enrichment graph SHALL include an `instagramNode` that orchestrates Instagram content extraction and LLM enrichment, producing an `EnrichedData` result.

#### Scenario: Full Instagram post enrichment
- **WHEN** the `instagramNode` processes a bookmark with an Instagram post or reel URL and SSR data is available
- **THEN** it SHALL extract content via `InstagramService`, pass the caption text (and accessibility caption if available) to `enrichContent()`, and return an `EnrichedData` object with populated `summary`, `entities`, `topics`, `tags`, and `metadata` containing: `instagramType`, `username`, `shortcode`, `mediaType`, `carouselMediaCount` (when applicable), and `hasAccessibilityCaption`

#### Scenario: Enrichment failure due to no SSR data
- **WHEN** the `instagramNode` processes a bookmark and `InstagramService` throws an error (empty JS shell, no caption data)
- **THEN** the `instagramNode` SHALL let the error propagate so the processor sets `enrichment_status` to `"failed"`

#### Scenario: LLM enrichment failure with Instagram content
- **WHEN** `enrichContent()` throws an error but Instagram content extraction succeeded
- **THEN** the `instagramNode` SHALL throw the error so the processor sets `enrichment_status` to `"failed"` (no fallback enrichment)

#### Scenario: Content passed to LLM
- **WHEN** caption text is available and being sent to `enrichContent()`
- **THEN** the content string SHALL include the caption text, and if available, the accessibility caption as supplementary context, with `contentType` set to `"instagram post"` or `"instagram reel"` matching the classified type

#### Scenario: Unrecognized Instagram URL sub-type
- **WHEN** the `instagramNode` receives a bookmark whose URL does not classify as a post, reel, or IGTV
- **THEN** it SHALL throw an error so the processor sets `enrichment_status` to `"failed"`
