import type { SourceType } from "@brain-feed/types";
import { createRedisConnection, createQueue } from "@brain-feed/worker-core";
import { getRequestId } from "@brain-feed/logger";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Job payload — mirrors EnrichmentJobData in worker-enrichment
// ---------------------------------------------------------------------------

export interface EnrichmentJobPayload {
  bookmarkId: string;
  userId: string;
  contentType: "link";
  sourceType: SourceType | null;
  url: string;
  requestId?: string;
}

// ---------------------------------------------------------------------------
// Queue singleton (lazy-initialised on first publish)
// ---------------------------------------------------------------------------

const QUEUE_NAME = "enrichment";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let queue: any = null;

/**
 * Returns the shared BullMQ queue instance, creating it lazily on first call.
 * The connection reads REDIS_HOST / REDIS_PORT from the environment with
 * sensible defaults (localhost:6379).
 */
function getEnrichmentQueue() {
  if (!queue) {
    const connection = createRedisConnection({
      host: process.env.REDIS_HOST ?? "localhost",
      port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
      tls: process.env.REDIS_TLS === "true",
    });
    queue = createQueue(QUEUE_NAME, connection);
  }
  return queue;
}

// ---------------------------------------------------------------------------
// Publish helper — fire-and-forget with error swallowing
// ---------------------------------------------------------------------------

/**
 * Publishes an enrichment job to the BullMQ queue.
 *
 * This is intentionally fire-and-forget: if Redis is down or the queue is
 * unreachable the bookmark is still saved (with status "pending") and can be
 * picked up by a future retry sweep.  Errors are logged but never thrown.
 */
export async function publishEnrichmentJob(
  payload: Omit<EnrichmentJobPayload, "requestId">,
): Promise<void> {
  try {
    const q = getEnrichmentQueue();
    const jobPayload: EnrichmentJobPayload = {
      ...payload,
      requestId: getRequestId(),
    };
    await q.add("enrich", jobPayload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
    logger.debug({ bookmarkId: payload.bookmarkId }, "Enrichment job published");
  } catch (err) {
    // Swallow — bookmark was already persisted with status "pending"
    logger.error({ err, bookmarkId: payload.bookmarkId }, "Failed to publish enrichment job");
  }
}

// ---------------------------------------------------------------------------
// Testing helpers
// ---------------------------------------------------------------------------

/**
 * Reset the queue singleton — used only in tests to inject a mock queue.
 */
export function _resetQueue(): void {
  queue = null;
}

/**
 * Inject a queue instance — used only in tests.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function _setQueue(q: any): void {
  queue = q;
}
