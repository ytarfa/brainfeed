import type { Job } from "bullmq";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SourceType } from "@brain-feed/types";
import {
  updateEnrichmentStatus,
  writeEnrichedData,
  fetchBookmarkForProcessing,
} from "@brain-feed/worker-core";

import { runPipeline } from "./pipeline";

// ---------------------------------------------------------------------------
// Job payload shape
// ---------------------------------------------------------------------------

export interface EnrichmentJobData {
  bookmarkId: string;
  userId: string;
  contentType: "link";
  sourceType: SourceType | null;
  url: string;
}

// ---------------------------------------------------------------------------
// Processor factory — creates the BullMQ processor function
// ---------------------------------------------------------------------------

export function createProcessor(
  supabase: SupabaseClient<Database>,
) {
  return async function processEnrichmentJob(
    job: Job<EnrichmentJobData>,
  ): Promise<void> {
    const { bookmarkId } = job.data;

    // Mark as processing
    await updateEnrichmentStatus(supabase, bookmarkId, "processing");

    try {
      // Fetch full bookmark data for the pipeline
      const bookmark = await fetchBookmarkForProcessing(supabase, bookmarkId);

      if (!bookmark) {
        console.error(`[enrichment] Bookmark ${bookmarkId} not found, skipping`);
        await updateEnrichmentStatus(supabase, bookmarkId, "failed");
        return;
      }

      // Run the enrichment pipeline
      const result = await runPipeline(bookmark);

      // Write enriched data (also sets status to "completed")
      await writeEnrichedData(supabase, bookmarkId, result);
    } catch (err) {
      console.error(`[enrichment] Failed to process bookmark ${bookmarkId}:`, err);
      await updateEnrichmentStatus(supabase, bookmarkId, "failed");
      throw err; // Re-throw so BullMQ records the failure and can retry
    }
  };
}
