## Purpose

Article enrichment capability — extracts content and metadata from web article URLs and enriches bookmarks via LLM summarization.

## Requirements

### Requirement: Article content extraction service

The worker-enrichment package SHALL provide an `ArticleService` in `src/services/article-service.ts` that fetches web pages and extracts article content and metadata.

#### Scenario: Successful article extraction
- **WHEN** `ArticleService.extract(url)` is called with a URL pointing to a readable HTML article
- **THEN** it SHALL return an object containing: `title` (string or null), `byline` (string or null), `siteName` (string or null), `content` (cleaned text string), `excerpt` (string or null), `lang` (string or null), `publishedTime` (string or null), `ogImage` (string or null), `wordCount` (number), and `readingTimeMinutes` (number)

#### Scenario: OG and meta tag extraction
- **WHEN** the HTML is fetched successfully
- **THEN** the service SHALL extract metadata from `og:title`, `og:description`, `og:image`, `og:site_name`, `article:author`, `article:published_time`, `meta[name="author"]`, `meta[name="description"]`, and JSON-LD `@type: "Article"` blocks using Cheerio before attempting Readability parsing

#### Scenario: Non-readable HTML fallback
- **WHEN** `isProbablyReaderable` returns `false` for the fetched HTML
- **THEN** the service SHALL return a thin result using OG/meta tag data only: `content` SHALL be the OG description or meta description (or empty string if neither exists), and `title` SHALL be the OG title or `<title>` tag content

#### Scenario: Fetch failure
- **WHEN** the HTTP fetch fails (network error, timeout, non-2xx status)
- **THEN** the service SHALL throw an error that the article node can catch and handle

#### Scenario: Non-HTML response
- **WHEN** the response `Content-Type` header does not indicate HTML (e.g., `application/pdf`, `image/png`)
- **THEN** the service SHALL throw an `UnsupportedContentError` that the article node can use to set `enrichment_status` to `"unsupported"`

#### Scenario: Content truncation
- **WHEN** the extracted article text exceeds `ARTICLE_MAX_CHARS` characters (default: 80,000)
- **THEN** the service SHALL truncate the text at a word boundary and append `"\n[Content truncated]"`

#### Scenario: User-Agent header
- **WHEN** fetching a web page
- **THEN** the service SHALL send a `User-Agent` header identifying itself as a bot/content-fetcher to respect site policies

#### Scenario: Fetch timeout
- **WHEN** the HTTP request exceeds the configured timeout (default: 30 seconds)
- **THEN** the service SHALL abort the request and throw a timeout error

### Requirement: Article enrichment graph node

The enrichment graph SHALL include an `articleNode` that orchestrates article extraction and LLM enrichment, producing an `EnrichedData` result.

#### Scenario: Full article enrichment
- **WHEN** the `articleNode` processes a bookmark with a readable article URL
- **THEN** it SHALL extract article content via `ArticleService`, pass the extracted text to `enrichContent(content, "article")`, and return an `EnrichedData` object with populated `summary`, `entities`, `topics`, `tags`, and `metadata` containing: `title`, `author`, `siteName`, `publishedAt`, `language`, `wordCount`, `readingTimeMinutes`, and `ogImage` (when available)

#### Scenario: Thin enrichment from metadata only
- **WHEN** the article is not readable (non-article page) or content is too short
- **THEN** the `articleNode` SHALL still call `enrichContent()` with whatever content is available (OG description, title) and return `EnrichedData` with metadata populated from OG/meta tags

#### Scenario: LLM enrichment failure with article content
- **WHEN** `enrichContent()` throws an error but article extraction succeeded
- **THEN** the `articleNode` SHALL return `EnrichedData` with `summary` set to the Readability excerpt (or OG description), empty `entities` and `topics`, empty `tags`, and metadata populated from the extraction result

#### Scenario: Fetch failure
- **WHEN** `ArticleService.extract()` throws a fetch error (not an unsupported content error)
- **THEN** the `articleNode` SHALL throw the error so the processor sets `enrichment_status` to `"failed"`

#### Scenario: Unsupported content type
- **WHEN** `ArticleService.extract()` throws an `UnsupportedContentError`
- **THEN** the `articleNode` SHALL return `EnrichedData` with `summary: null`, empty arrays, and a `metadata` field containing `{ unsupported: "true" }`, and the processor SHALL set `enrichment_status` to `"unsupported"`
