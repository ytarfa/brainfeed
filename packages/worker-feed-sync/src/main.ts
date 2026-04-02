/**
 * Feed sync worker standalone entry point.
 *
 * Creates a BullMQ queue and worker for feed-sync jobs, starts the scheduler
 * to poll for due feeds, and exposes a health endpoint.
 *
 * This file should only be run as a standalone process (via `start` or `dev`
 * scripts). Library exports for use by the backend live in `./index.ts`.
 */

import {
  loadConfig,
  createRedisConnectionFromConfig,
  createQueue,
  createWorker,
  createServiceClient,
} from "@brain-feed/worker-core";
import { createLogger } from "@brain-feed/logger";

import { createScheduler } from "./scheduler";
import { createProcessor } from "./feed-sync-processor";
import { createInserter } from "./feed-item-inserter";
import { startHealthServer } from "./health";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUEUE_NAME = "feed-sync";
const ENRICHMENT_QUEUE_NAME = "enrichment";
const DEFAULT_WORKER_PORT = 3003;

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

const logger = createLogger({ name: "feed-sync-worker" });

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  logger.info("Starting feed sync worker...");

  // Load config from environment
  const config = loadConfig();

  // Create Redis connection (shared between queue, worker, scheduler)
  const redis = createRedisConnectionFromConfig(config);

  // Create Supabase service client
  const supabase = createServiceClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  // Create the feed-sync queue (scheduler enqueues jobs here)
  const feedSyncQueue = createQueue(QUEUE_NAME, redis);

  // Create the enrichment queue (inserter enqueues enrichment jobs here)
  const enrichmentQueue = createQueue(ENRICHMENT_QUEUE_NAME, redis);

  // Create the inserter (used by the processor)
  const inserter = createInserter({
    supabase,
    enrichmentQueue,
    logger,
  });

  // Create the job processor
  const processor = createProcessor({ supabase, inserter, logger });

  // Create and start the BullMQ worker
  const concurrency = parseInt(
    process.env.FEED_SYNC_CONCURRENCY ?? "5",
    10,
  );

  const worker = createWorker(
    QUEUE_NAME,
    processor,
    redis,
    { concurrency },
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, feedId: job.data.feedId }, "Feed sync job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, feedId: job?.data.feedId, err }, "Feed sync job failed");
  });

  // Create and start the scheduler
  const schedulerIntervalMs = parseInt(
    process.env.FEED_SYNC_SCHEDULER_INTERVAL_MS ?? "60000",
    10,
  );

  const scheduler = createScheduler({
    supabase,
    queue: feedSyncQueue,
    logger,
    intervalMs: schedulerIntervalMs,
  });

  scheduler.start();

  // Start health endpoint
  const port = parseInt(
    process.env.PORT ?? process.env.WORKER_PORT ?? String(DEFAULT_WORKER_PORT),
    10,
  );
  const server = startHealthServer(port, logger);

  logger.info({ queue: QUEUE_NAME, concurrency }, "Worker listening on queue");

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down...");
    scheduler.stop();
    await worker.close();
    server.close();
    await redis.quit();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal error");
  process.exit(1);
});
