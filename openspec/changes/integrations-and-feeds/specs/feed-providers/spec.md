# Feed Providers

## ADDED Requirements

### Requirement: FeedProvider interface

All feed providers implement a common interface that includes both runtime logic and UI metadata.

#### Scenario: Interface definition

WHEN a new feed provider is implemented
THEN it conforms to the `FeedProvider` interface:
  - `meta`: `FeedProviderMeta` — static metadata for registration and UI rendering
  - `fetchNewItems(config, since, token?)`: fetches items published since the given date, returns `FeedItem[]`
  - `resolveDisplayName?(config, token?)`: optional method to resolve a human-friendly name from the config (e.g., channel ID → channel name)

#### Scenario: FeedProviderMeta structure

WHEN a provider's metadata is registered
THEN `FeedProviderMeta` includes:
  - `type`: unique string identifier matching the `feed_type` column
  - `displayName`: human-readable name (e.g., "RSS Feed")
  - `icon`: icon identifier or emoji
  - `description`: one-sentence description
  - `requiresIntegration`: boolean
  - `requiredProvider`: string or null (which integration provider is needed)
  - `sourceType`: the `source_type` value to set on bookmarks produced by this feed (e.g., `'article'` for RSS)
  - `configFields`: array of `ConfigField` objects describing the form fields for feed creation

### Requirement: Feed provider registry

A registry maps feed type strings to their provider implementations.

#### Scenario: Provider registration and lookup

WHEN the feed sync worker or backend starts
THEN all providers are registered in a map: `{ [type: string]: FeedProvider }`
AND `getProvider(type)` returns the provider or throws if unregistered
AND `getAllProviderMeta()` returns an array of `FeedProviderMeta` from all registered providers

### Requirement: RSS feed provider

#### Scenario: RSS provider metadata

WHEN the RSS provider is registered
THEN its metadata is:
  - `type`: `'rss'`
  - `displayName`: `'RSS Feed'`
  - `description`: `'Subscribe to any RSS or Atom feed'`
  - `requiresIntegration`: `false`
  - `sourceType`: `'article'`
  - `configFields`: one field — `{ key: 'url', label: 'Feed URL', type: 'text', placeholder: 'https://blog.example.com/feed.xml', required: true }`

#### Scenario: RSS config schema

WHEN a feed with type `'rss'` is created
THEN the config is validated against a Zod schema requiring:
  - `url`: string, valid URL

#### Scenario: Fetching RSS items

WHEN `fetchNewItems(config, since)` is called on the RSS provider
THEN it fetches the RSS/Atom feed at `config.url` using an RSS parser library
AND filters items to those published after `since` (using the item's `pubDate` or `updated` field)
AND if `since` is null (first sync), returns the most recent 20 items
AND for each item, returns a `FeedItem` with:
  - `url`: the item's link
  - `title`: the item's title
  - `description`: the item's description or content snippet (truncated to 500 chars)
  - `thumbnail`: the item's media thumbnail or enclosure image (if available)
  - `publishedAt`: the item's publication date

#### Scenario: Resolving RSS display name

WHEN `resolveDisplayName(config)` is called
THEN it fetches the feed and returns the feed's `title` field (e.g., "Hacker News", "TechCrunch")

### Requirement: YouTube channel feed provider

#### Scenario: YouTube channel provider metadata

WHEN the YouTube channel provider is registered
THEN its metadata is:
  - `type`: `'youtube_channel'`
  - `displayName`: `'YouTube Channel'`
  - `description`: `'Get new videos from a YouTube channel'`
  - `requiresIntegration`: `false` (uses global `GOOGLE_API_KEY` for public data)
  - `sourceType`: `'youtube'`
  - `configFields`: one field — `{ key: 'channelId', label: 'Channel ID or URL', type: 'text', placeholder: 'UC... or https://youtube.com/@handle', required: true }`

#### Scenario: YouTube channel config schema

WHEN a feed with type `'youtube_channel'` is created
THEN the config is validated against a Zod schema requiring:
  - `channelId`: string (a YouTube channel ID, resolved from URL or handle if needed)

#### Scenario: Fetching YouTube channel videos

WHEN `fetchNewItems(config, since)` is called on the YouTube channel provider
THEN it calls the YouTube Data API v3:
  - `GET /search?part=snippet&channelId={channelId}&type=video&order=date&publishedAfter={since}`
  - Uses `GOOGLE_API_KEY` (global key) for authentication
AND filters results to those published after `since`
AND if `since` is null (first sync), returns the most recent 10 videos
AND for each video, returns a `FeedItem` with:
  - `url`: `https://www.youtube.com/watch?v={videoId}`
  - `title`: the video title
  - `description`: the video description (truncated to 500 chars)
  - `thumbnail`: the video's medium or high thumbnail URL
  - `publishedAt`: the video's publish date

#### Scenario: Resolving YouTube channel display name

WHEN `resolveDisplayName(config)` is called
THEN it calls the YouTube Data API: `GET /channels?part=snippet&id={channelId}`
AND returns the channel's title

#### Scenario: Handling channel URL or handle input

WHEN the user provides a YouTube URL (`https://youtube.com/@handle`) or handle instead of a channel ID
THEN the provider resolves it to a channel ID before storing in config
AND this resolution happens during feed creation (in the backend route handler or provider's resolve method)

### Requirement: GitHub repository feed provider

#### Scenario: GitHub repo provider metadata

WHEN the GitHub repo provider is registered
THEN its metadata is:
  - `type`: `'github_repo'`
  - `displayName`: `'GitHub Repository'`
  - `description`: `'Track issues, pull requests, and releases from a GitHub repo'`
  - `requiresIntegration`: `true`
  - `requiredProvider`: `'github'`
  - `sourceType`: `'github'`
  - `configFields`:
    - `{ key: 'owner', label: 'Repository owner', type: 'text', placeholder: 'facebook', required: true }`
    - `{ key: 'repo', label: 'Repository name', type: 'text', placeholder: 'react', required: true }`
    - `{ key: 'watch', label: 'Watch', type: 'multiselect', required: true, options: [{ label: 'Issues', value: 'issues' }, { label: 'Pull Requests', value: 'pulls' }, { label: 'Releases', value: 'releases' }] }`

#### Scenario: GitHub repo config schema

WHEN a feed with type `'github_repo'` is created
THEN the config is validated against a Zod schema requiring:
  - `owner`: string
  - `repo`: string
  - `watch`: array of strings from `['issues', 'pulls', 'releases']`, at least one required

#### Scenario: Fetching GitHub repo items

WHEN `fetchNewItems(config, since, token)` is called on the GitHub repo provider
THEN for each watch type in `config.watch`:
  - For `'issues'`: calls `GET /repos/{owner}/{repo}/issues?state=open&sort=created&since={since}&direction=desc` (with `token` in Authorization header)
  - For `'pulls'`: calls `GET /repos/{owner}/{repo}/pulls?state=open&sort=created&direction=desc` and filters by `created_at > since`
  - For `'releases'`: calls `GET /repos/{owner}/{repo}/releases?per_page=10` and filters by `published_at > since`
AND if `since` is null (first sync), returns the most recent 10 items per watch type
AND for each item, returns a `FeedItem` with:
  - `url`: the item's `html_url`
  - `title`: the item's title (for issues/PRs) or release name (for releases)
  - `description`: the item's body (truncated to 500 chars)
  - `publishedAt`: `created_at` (issues/PRs) or `published_at` (releases)
  - `metadata`: `{ type: 'issue' | 'pull' | 'release', number, labels, author }`

#### Scenario: Resolving GitHub repo display name

WHEN `resolveDisplayName(config)` is called
THEN it returns `'{owner}/{repo}'`
