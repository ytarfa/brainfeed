import type { EnrichedData } from "@brain-feed/types";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";

import { enrichmentGraph } from "./enrichment-graph";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the enrichment pipeline on a bookmark.
 *
 * Passes the bookmark to the enrichment subgraph which produces structured
 * enriched data (summary, entities, topics, tags).
 *
 * Returns a valid `EnrichedData` object.
 */
export async function runPipeline(
  bookmark: BookmarkForProcessing,
): Promise<EnrichedData> {
  const output = await enrichmentGraph.invoke({
    bookmark,
    result: null,
  });

  return output.result as EnrichedData;
}
