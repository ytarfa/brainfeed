## Requirements

### Requirement: UrlHandler interface for per-URL-type handling
The system SHALL define a `UrlHandler` interface with the following contract:
- A readonly `sourceType: SourceType` property declaring the handler's source type
- A `matches(url: URL, og: OgMetadata): boolean` method that determines if this handler applies to the given URL and OG metadata
- A `resolve(url: URL, og: OgMetadata): Promise<Partial<ResolvedBookmark>>` method that returns handler-specific field overrides

Handlers SHALL be stateless and side-effect-free. The `resolve()` method SHALL only be called when `matches()` returns true.

#### Scenario: Handler declares its source type
- **WHEN** a `UrlHandler` instance is inspected
- **THEN** it exposes a readonly `sourceType` property with a valid `SourceType` value

#### Scenario: Handler matches applicable URL
- **WHEN** `matches()` is called with a URL and OG metadata that the handler recognizes
- **THEN** it returns `true`

#### Scenario: Handler does not match inapplicable URL
- **WHEN** `matches()` is called with a URL and OG metadata the handler does not recognize
- **THEN** it returns `false`

#### Scenario: Handler resolve returns partial overrides
- **WHEN** `resolve()` is called on a matching handler
- **THEN** it returns a `Promise<Partial<ResolvedBookmark>>` containing only the fields it wants to override

### Requirement: ResolvedBookmark type as unified output
The system SHALL define a `ResolvedBookmark` type with the following fields: `sourceType: SourceType`, `thumbnailUrl: string | null`, `title: string | null`, `description: string | null`, `author: string | null`. This type SHALL be the sole output of the URL handler registry and SHALL be consumed directly by the route handler.

#### Scenario: ResolvedBookmark contains all metadata fields
- **WHEN** the registry resolves a URL
- **THEN** the result is a `ResolvedBookmark` object with `sourceType`, `thumbnailUrl`, `title`, `description`, and `author` fields

### Requirement: UrlHandlerRegistry orchestration with OG base layer
The system SHALL implement a `UrlHandlerRegistry` that:
1. Accepts a raw URL string
2. Fetches OG metadata via `OgFetcher` (always, for every URL)
3. Substitutes a sentinel `NULL_OG_METADATA` object (all fields null) if the OG fetch returns null
4. Builds a `ResolvedBookmark` base from OG metadata fields (`og.image` → `thumbnailUrl`, `og.title` → `title`, `og.description` → `description`, `og.author` → `author`, sourceType `"generic"`)
5. Iterates registered handlers in order, calling `matches(url, og)` on each
6. For the first matching handler, calls `resolve(url, og)` and merges the result over the base: `{ ...base, ...overrides, sourceType: handler.sourceType }`
7. If no handler matches, returns the base with `sourceType: "generic"`

The merge SHALL use spread semantics where handler overrides take precedence. Only non-undefined fields from the handler override SHALL replace base fields.

#### Scenario: URL matched by a handler
- **WHEN** `registry.resolve("https://www.youtube.com/watch?v=abc123")` is called
- **THEN** OG metadata is fetched, the YouTube handler matches, its `resolve()` overrides are merged over the OG base, and a `ResolvedBookmark` with `sourceType: "youtube"` is returned

#### Scenario: URL not matched by any handler
- **WHEN** `registry.resolve("https://example.com/some-page")` is called and no handler's `matches()` returns true
- **THEN** the OG-based `ResolvedBookmark` is returned with `sourceType: "generic"`

#### Scenario: OG fetch fails
- **WHEN** `registry.resolve()` is called and the OG fetch returns null (network error, timeout, non-HTML)
- **THEN** the sentinel `NULL_OG_METADATA` is used, the base `ResolvedBookmark` has all-null fields, and handler matching and resolution still proceed normally

#### Scenario: Handler provides partial overrides
- **WHEN** a handler's `resolve()` returns `{ thumbnailUrl: "https://..." }` (only thumbnailUrl)
- **THEN** the final `ResolvedBookmark` retains the OG-derived `title`, `description`, and `author` values, with only `thumbnailUrl` overridden

### Requirement: First-match-wins handler ordering
The system SHALL evaluate handlers in registration order and use the first handler where `matches()` returns true. Subsequent handlers SHALL NOT be evaluated after a match is found. The registration order SHALL be: YouTube, GitHub, Instagram, Article.

#### Scenario: YouTube handler takes priority over Article handler
- **WHEN** a YouTube URL is processed and both the YouTube handler and Article handler could match (YouTube pages have article-like OG metadata)
- **THEN** the YouTube handler matches first and the Article handler is not evaluated

#### Scenario: Instagram handler takes priority over Article handler
- **WHEN** an Instagram URL is processed and the Instagram SSR page has `og:type: "article"`
- **THEN** the Instagram handler matches first and the Article handler is not evaluated

#### Scenario: Article handler matches when no platform handler does
- **WHEN** a URL has `og:type` of `"article"` and does not match YouTube, GitHub, or Instagram handlers
- **THEN** the Article handler matches and returns `sourceType: "article"`

### Requirement: YouTube URL handler
The system SHALL implement a `YouTubeHandler` that:
- Has `sourceType: "youtube"`
- `matches()` returns true when the URL hostname is `youtube.com`, `www.youtube.com`, `youtu.be`, or `m.youtube.com`, OR when OG metadata has `siteName` of `"YouTube"`
- `resolve()` extracts the video ID from the URL and returns `{ thumbnailUrl: "https://img.youtube.com/vi/{videoId}/hqdefault.jpg" }`
- SHALL support URL patterns: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`
- If the video ID cannot be extracted, `resolve()` SHALL return an empty object (falling back to OG image)

#### Scenario: Standard YouTube watch URL
- **WHEN** `matches()` is called with URL `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- **THEN** it returns true
- **AND WHEN** `resolve()` is called
- **THEN** it returns `{ thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" }`

#### Scenario: Short YouTube URL
- **WHEN** `matches()` is called with URL `https://youtu.be/dQw4w9WgXcQ`
- **THEN** it returns true
- **AND WHEN** `resolve()` is called
- **THEN** it returns `{ thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" }`

#### Scenario: YouTube embed URL
- **WHEN** `matches()` is called with URL `https://www.youtube.com/embed/dQw4w9WgXcQ`
- **THEN** it returns true
- **AND WHEN** `resolve()` is called
- **THEN** it returns `{ thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" }`

#### Scenario: YouTube URL without extractable video ID
- **WHEN** `resolve()` is called with URL `https://www.youtube.com/channel/UC123`
- **THEN** it returns `{}` (empty object, OG image used as fallback)

#### Scenario: YouTube detected via OG siteName
- **WHEN** `matches()` is called with a non-youtube.com URL but OG metadata has `siteName: "YouTube"`
- **THEN** it returns true

### Requirement: GitHub URL handler
The system SHALL implement a `GitHubHandler` that:
- Has `sourceType: "github"`
- `matches()` returns true when the URL hostname is `github.com` or `www.github.com`
- `resolve()` extracts the owner and repository name from the URL path and returns `{ thumbnailUrl: "https://opengraph.githubassets.com/1/{owner}/{repo}" }`
- SHALL support URLs with paths deeper than `/{owner}/{repo}` (issues, PRs, files) by extracting only the first two path segments
- If owner/repo cannot be extracted, `resolve()` SHALL return an empty object

#### Scenario: GitHub repository URL
- **WHEN** `resolve()` is called with URL `https://github.com/facebook/react`
- **THEN** it returns `{ thumbnailUrl: "https://opengraph.githubassets.com/1/facebook/react" }`

#### Scenario: GitHub deep URL
- **WHEN** `resolve()` is called with URL `https://github.com/facebook/react/issues/123`
- **THEN** it returns `{ thumbnailUrl: "https://opengraph.githubassets.com/1/facebook/react" }`

#### Scenario: GitHub URL without owner/repo
- **WHEN** `resolve()` is called with URL `https://github.com/settings`
- **THEN** it returns `{}` (empty object, OG image used as fallback)

### Requirement: Instagram URL handler

The system SHALL implement an `InstagramHandler` that:
- Has `sourceType: "instagram"`
- `matches()` returns true when the URL hostname is `instagram.com`, `www.instagram.com`, or `m.instagram.com`
- `resolve()` extracts the `og:image` from OG metadata (if available) and returns `{ thumbnailUrl: og.image }`, or an empty object if OG image is not available
- The handler does NOT need to classify post vs reel — that is done by the enrichment worker

#### Scenario: Instagram post URL
- **WHEN** `matches()` is called with URL `https://www.instagram.com/p/DFnr9wdxJoI/`
- **THEN** it returns true
- **AND WHEN** `resolve()` is called with OG metadata containing `image: "https://scontent-*.cdninstagram.com/..."`
- **THEN** it returns `{ thumbnailUrl: "https://scontent-*.cdninstagram.com/..." }`

#### Scenario: Instagram reel URL
- **WHEN** `matches()` is called with URL `https://www.instagram.com/reel/DWiTx5IgYHE/`
- **THEN** it returns true

#### Scenario: Instagram IGTV URL
- **WHEN** `matches()` is called with URL `https://www.instagram.com/tv/ABC123/`
- **THEN** it returns true

#### Scenario: Instagram mobile URL
- **WHEN** `matches()` is called with URL `https://m.instagram.com/p/DFnr9wdxJoI/`
- **THEN** it returns true

#### Scenario: Instagram profile URL (also matched)
- **WHEN** `matches()` is called with URL `https://www.instagram.com/natgeo/`
- **THEN** it returns true (the handler matches all Instagram hostnames; unsupported sub-types fail at enrichment time)

#### Scenario: Instagram URL with no OG image
- **WHEN** `resolve()` is called and OG metadata has no `image` field (Instagram often returns no OG tags for posts)
- **THEN** it returns `{}` (empty object, no thumbnail override)

#### Scenario: Non-Instagram URL
- **WHEN** `matches()` is called with URL `https://www.example.com/p/something/`
- **THEN** it returns false

### Requirement: Article URL handler
The system SHALL implement an `ArticleHandler` that:
- Has `sourceType: "article"`
- `matches()` returns true when OG metadata has `type` of `"article"`, OR when `author` is non-null, OR when `publishedAt` is non-null
- `resolve()` SHALL return an empty object (all metadata comes from OG base layer)

#### Scenario: Article detected by og:type
- **WHEN** `matches()` is called with OG metadata containing `type: "article"`
- **THEN** it returns true

#### Scenario: Article detected by author presence
- **WHEN** `matches()` is called with OG metadata containing `author: "John Doe"` but no `type: "article"`
- **THEN** it returns true

#### Scenario: Article detected by publishedAt presence
- **WHEN** `matches()` is called with OG metadata containing `publishedAt: "2024-01-15"` but no `type: "article"` and no `author`
- **THEN** it returns true

#### Scenario: Article resolve returns empty overrides
- **WHEN** `resolve()` is called on the Article handler
- **THEN** it returns `{}` (all metadata comes from the OG base layer)

### Requirement: Route handler simplified to single registry call
The `POST /bookmarks` route handler SHALL replace its multi-service orchestration with:
1. Call `registry.resolve(url)` to get a `ResolvedBookmark`
2. Use `resolvedBookmark.sourceType` for `source_type`
3. Use `resolvedBookmark.thumbnailUrl` for `thumbnail_url`
4. Use `body.title ?? resolvedBookmark.title` for `title` (user-provided title takes precedence)

The route handler SHALL NOT import or call `bookmarkService`, `resolveThumbnail`, or any deleted service directly.

#### Scenario: Route handler uses registry for bookmark creation
- **WHEN** a POST request creates a bookmark with a URL
- **THEN** the route handler calls `registry.resolve(url)` and uses the returned `ResolvedBookmark` fields for the database insert

#### Scenario: User-provided title takes precedence
- **WHEN** a POST request includes both a URL and a `title` field
- **THEN** the user-provided `title` is used instead of the OG-derived title from `ResolvedBookmark`
