## MODIFIED Requirements

### Requirement: Enrichment pipeline stub

The enrichment pipeline SHALL be implemented as a LangGraph `StateGraph` with route-specific nodes. The YouTube node SHALL perform full enrichment (URL classification, data fetching, LLM summarization) and return a populated `EnrichedData` object. The article node SHALL perform full enrichment (HTML fetching, content extraction via Readability, OG/meta tag extraction, LLM summarization) and return a populated `EnrichedData` object. The GitHub node SHALL perform full enrichment (URL classification into repo/issue/PR, data fetching via the GitHub REST API, LLM summarization) and return a populated `EnrichedData` object. The generic node SHALL remain as a stub returning placeholder values.

#### Scenario: YouTube pipeline execution
- **WHEN** the YouTube pipeline node is invoked with bookmark data containing a YouTube URL
- **THEN** it SHALL classify the URL type, fetch relevant data (transcript/metadata), invoke the LLM for summarization, and return an `EnrichedData` object with populated `summary`, `entities`, `topics`, `tags`, `metadata`, and `processedAt`

#### Scenario: YouTube pipeline with unavailable data
- **WHEN** the YouTube pipeline node is invoked but external data fetching fails partially
- **THEN** it SHALL still produce the best possible `EnrichedData` using whatever data was successfully retrieved, rather than returning empty data

#### Scenario: Article pipeline execution
- **WHEN** the article pipeline node is invoked with bookmark data containing an article URL
- **THEN** it SHALL fetch the HTML, extract article content and metadata, invoke the LLM for summarization, and return an `EnrichedData` object with populated `summary`, `entities`, `topics`, `tags`, `metadata`, and `processedAt`

#### Scenario: Article pipeline with non-readable content
- **WHEN** the article pipeline node is invoked but the page is not readable (e.g., a web app landing page)
- **THEN** it SHALL still produce the best possible `EnrichedData` using OG/meta tag data, rather than returning empty data

#### Scenario: GitHub pipeline execution
- **WHEN** the GitHub pipeline node is invoked with bookmark data containing a GitHub URL
- **THEN** it SHALL classify the URL sub-type (repo/issue/PR), fetch relevant data via the GitHub REST API, invoke the LLM for summarization, and return an `EnrichedData` object with populated `summary`, `entities`, `topics`, `tags`, `metadata`, and `processedAt`

#### Scenario: GitHub pipeline with README unavailable
- **WHEN** the GitHub pipeline node is invoked for a repository URL but the README fetch fails
- **THEN** it SHALL still produce enrichment using the repository description, language, topics, and statistics, rather than failing entirely

#### Scenario: Stub pipeline execution for generic route
- **WHEN** the generic pipeline node is invoked with bookmark data
- **THEN** it SHALL return an `EnrichedData` object with `summary: null`, `entities: []`, `topics: []`, and a `processedAt` timestamp
