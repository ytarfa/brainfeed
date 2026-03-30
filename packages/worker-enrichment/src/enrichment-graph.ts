import { Annotation, StateGraph } from "@langchain/langgraph";
import type { EnrichedData } from "@brain-feed/types";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";

// ---------------------------------------------------------------------------
// Enrichment subgraph state
// ---------------------------------------------------------------------------

export const EnrichmentSubgraphState = Annotation.Root({
  bookmark: Annotation<BookmarkForProcessing>,
  result: Annotation<EnrichedData | null>,
});

export type EnrichmentSubgraphStateType = typeof EnrichmentSubgraphState.State;

// ---------------------------------------------------------------------------
// Route keys — the string values returned by the router and used as
// conditional-edge keys.  Exported for testing.
// ---------------------------------------------------------------------------

export type EnrichmentRoute =
  | "github"
  | "youtube"
  | "generic";

// ---------------------------------------------------------------------------
// URL-based source-type detection (fallback when source_type is null)
// ---------------------------------------------------------------------------

const URL_PATTERNS: [RegExp, EnrichmentRoute][] = [
  [/github\.com/i, "github"],
  [/youtube\.com|youtu\.be/i, "youtube"],
];

/**
 * Detect the enrichment route from a URL string.
 * Returns `null` if no pattern matches (caller should fall back to "generic").
 */
export function detectRouteFromUrl(url: string): EnrichmentRoute | null {
  for (const [pattern, route] of URL_PATTERNS) {
    if (pattern.test(url)) {
      return route;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Source-type → route mapping (for bookmarks that already have a source_type)
// ---------------------------------------------------------------------------

const SOURCE_TYPE_TO_ROUTE: Record<string, EnrichmentRoute> = {
  github: "github",
  youtube: "youtube",
  generic: "generic",
};

/**
 * Determine the enrichment route for a bookmark.
 *
 * Priority:
 *  1. `source_type` if present and mapped
 *  2. URL pattern matching
 *  3. "generic" fallback
 */
export function resolveRoute(bookmark: BookmarkForProcessing): EnrichmentRoute {
  // 1. Explicit source_type
  if (bookmark.source_type) {
    const mapped = SOURCE_TYPE_TO_ROUTE[bookmark.source_type];
    if (mapped) {
      return mapped;
    }
  }

  // 2. URL pattern detection
  if (bookmark.url) {
    const detected = detectRouteFromUrl(bookmark.url);
    if (detected) {
      return detected;
    }
  }

  // 3. Fallback
  return "generic";
}

// ---------------------------------------------------------------------------
// Router node — reads state, returns route key via resolveRoute
// ---------------------------------------------------------------------------

function routeNode(
  state: EnrichmentSubgraphStateType,
): EnrichmentRoute {
  return resolveRoute(state.bookmark);
}

// ---------------------------------------------------------------------------
// Source-specific enrichment nodes (placeholders)
//
// Each node receives the full state and returns a partial update with the
// enriched result. Replace the body with real logic (API calls, LLM prompts,
// page fetching, etc.) as each source type is implemented.
// ---------------------------------------------------------------------------

function emptyEnrichedData(): EnrichedData {
  return {
    summary: null,
    entities: [],
    topics: [],
    tags: [],
    metadata: null,
    processedAt: new Date().toISOString(),
  };
}

async function githubNode(
  _state: EnrichmentSubgraphStateType,
): Promise<Partial<EnrichmentSubgraphStateType>> {
  // TODO: Fetch repo metadata, README, etc.
  return { result: emptyEnrichedData() };
}

async function youtubeNode(
  _state: EnrichmentSubgraphStateType,
): Promise<Partial<EnrichmentSubgraphStateType>> {
  // TODO: Fetch transcript, video metadata, etc.
  return { result: emptyEnrichedData() };
}

async function genericNode(
  _state: EnrichmentSubgraphStateType,
): Promise<Partial<EnrichmentSubgraphStateType>> {
  // TODO: Generic web page enrichment (fetch, extract, summarize)
  return { result: emptyEnrichedData() };
}

// ---------------------------------------------------------------------------
// Compile the enrichment subgraph with conditional routing
// ---------------------------------------------------------------------------

const ROUTE_MAP = {
  github: "github",
  youtube: "youtube",
  generic: "generic",
} as const;

export const enrichmentGraph = new StateGraph(EnrichmentSubgraphState)
  // Source-specific nodes
  .addNode("github", githubNode)
  .addNode("youtube", youtubeNode)
  .addNode("generic", genericNode)
  // Route from __start__ to the correct node
  .addConditionalEdges("__start__", routeNode, ROUTE_MAP)
  // All enrichment nodes flow to __end__
  .addEdge("github", "__end__")
  .addEdge("youtube", "__end__")
  .addEdge("generic", "__end__")
  .compile();
