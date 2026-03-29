import { Annotation, StateGraph } from "@langchain/langgraph";
import type { EnrichedData } from "@brain-feed/types";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";

// ---------------------------------------------------------------------------
// State schema for the enrichment pipeline
// ---------------------------------------------------------------------------

const EnrichmentState = Annotation.Root({
  bookmark: Annotation<BookmarkForProcessing>,
  result: Annotation<EnrichedData | null>,
});

type EnrichmentStateType = typeof EnrichmentState.State;

// ---------------------------------------------------------------------------
// Pipeline nodes — currently a single pass-through stub
// ---------------------------------------------------------------------------

async function enrichNode(
  state: EnrichmentStateType,
): Promise<Partial<EnrichmentStateType>> {
  // Stub: returns placeholder EnrichedData.
  // Replace this with real LLM / extraction logic later.
  const enriched: EnrichedData = {
    summary: null,
    entities: [],
    topics: [],
    metadata: null,
    processedAt: new Date().toISOString(),
  };

  return { result: enriched };
}

// ---------------------------------------------------------------------------
// Build the LangGraph state graph
// ---------------------------------------------------------------------------

const graph = new StateGraph(EnrichmentState)
  .addNode("enrich", enrichNode)
  .addEdge("__start__", "enrich")
  .addEdge("enrich", "__end__")
  .compile();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the enrichment pipeline on a bookmark.
 *
 * Returns a valid `EnrichedData` object. Currently a stub that produces
 * placeholder values — will be replaced with real LLM-powered enrichment.
 */
export async function runPipeline(
  bookmark: BookmarkForProcessing,
): Promise<EnrichedData> {
  const output = await graph.invoke({ bookmark, result: null });
  // The graph always produces a result via the enrich node
  return output.result as EnrichedData;
}
