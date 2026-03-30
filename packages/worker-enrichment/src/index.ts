import {
  loadConfig,
  createRedisConnectionFromConfig,
  createWorker,
  createServiceClient,
} from "@brain-feed/worker-core";
import { createLogger } from "@brain-feed/logger";

import { createProcessor } from "./processor";
import type { EnrichmentJobData } from "./processor";
import { startHealthServer } from "./health";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUEUE_NAME = "enrichment";
const DEFAULT_WORKER_PORT = 3002;

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

const logger = createLogger({ name: "enrichment-worker" });

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  logger.info("Starting enrichment worker...");

  // Load config from environment
  const config = loadConfig();

  // Create Redis connection (shared between worker instances)
  const redis = createRedisConnectionFromConfig(config);

  // Create Supabase service client
  const supabase = createServiceClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  // Create the job processor
  const processor = createProcessor(supabase, logger);

  // Create and start the BullMQ worker
  const worker = createWorker<EnrichmentJobData>(
    QUEUE_NAME,
    processor,
    redis,
    { concurrency: 5 },
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, bookmarkId: job.data.bookmarkId }, "Job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, bookmarkId: job?.data.bookmarkId, err }, "Job failed");
  });

  // Start health endpoint — Railway sends health checks to PORT, so prefer that
  const port = parseInt(process.env.PORT ?? process.env.WORKER_PORT ?? String(DEFAULT_WORKER_PORT), 10);
  const server = startHealthServer(port, logger);

  logger.info({ queue: QUEUE_NAME, concurrency: 5 }, "Worker listening on queue");

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down...");
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
