## MODIFIED Requirements

### Requirement: Enrichment pipeline stub

The enrichment pipeline SHALL be implemented as a LangGraph `StateGraph` with route-specific nodes. The YouTube node SHALL perform full enrichment (URL classification, data fetching, LLM summarization) and return a populated `EnrichedData` object. The GitHub and generic nodes SHALL remain as stubs returning placeholder values.

#### Scenario: YouTube pipeline execution
- **WHEN** the YouTube pipeline node is invoked with bookmark data containing a YouTube URL
- **THEN** it SHALL classify the URL type, fetch relevant data (transcript/metadata), invoke the LLM for summarization, and return an `EnrichedData` object with populated `summary`, `entities`, `topics`, `tags`, `metadata`, and `processedAt`

#### Scenario: YouTube pipeline with unavailable data
- **WHEN** the YouTube pipeline node is invoked but external data fetching fails partially
- **THEN** it SHALL still produce the best possible `EnrichedData` using whatever data was successfully retrieved, rather than returning empty data

#### Scenario: Stub pipeline execution for other routes
- **WHEN** the GitHub or generic pipeline node is invoked with bookmark data
- **THEN** it SHALL return an `EnrichedData` object with `summary: null`, `entities: []`, `topics: []`, and a `processedAt` timestamp
