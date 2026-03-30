## Purpose

LLM integration for content enrichment — model configuration and structured output extraction.

## Requirements

### Requirement: LLM model factory

The worker-enrichment package SHALL provide a `getModel()` factory function in `src/services/llm.ts` that returns a configured `ChatOpenRouter` instance.

#### Scenario: Default model configuration
- **WHEN** `getModel()` is called without arguments
- **THEN** it SHALL return a `ChatOpenRouter` instance using the model specified by the `ENRICHMENT_MODEL` environment variable, or `"google/gemini-2.0-flash-001"` if the variable is not set

#### Scenario: API key resolution
- **WHEN** the `ChatOpenRouter` instance is created
- **THEN** it SHALL use the `OPENROUTER_API_KEY` environment variable automatically (via LangChain's built-in env resolution)

### Requirement: Structured content enrichment

The worker-enrichment package SHALL provide an `enrichContent()` function that takes raw content and returns a typed `EnrichedData`-compatible result via LLM with Zod structured output.

#### Scenario: Successful enrichment
- **WHEN** `enrichContent(content, contentType)` is called with non-empty content
- **THEN** it SHALL invoke the LLM with a prompt instructing it to produce a summary, entities, topics, and tags, and SHALL return the parsed structured output matching the Zod schema

#### Scenario: Structured output schema
- **WHEN** the LLM is invoked for enrichment
- **THEN** `withStructuredOutput` SHALL be called with a Zod schema defining: `summary` (string), `entities` (array of `{ name: string, type: string }`), `topics` (string array, max 10), and `tags` (string array, max 15)

#### Scenario: LLM invocation failure
- **WHEN** the LLM call fails (network error, rate limit, invalid response)
- **THEN** `enrichContent()` SHALL throw the error, allowing the caller to handle it (e.g., BullMQ retry)

#### Scenario: Empty content
- **WHEN** `enrichContent()` is called with empty or whitespace-only content
- **THEN** it SHALL return a result with `summary: null`, empty `entities`, `topics`, and `tags`
