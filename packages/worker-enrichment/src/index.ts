import {
  loadConfig,
  createRedisConnectionFromConfig,
  createWorker,
  createServiceClient,
} from "@brain-feed/worker-core";

import { createProcessor } from "./processor";
import type { EnrichmentJobData } from "./processor";
import { startHealthServer } from "./health";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUEUE_NAME = "enrichment";
const DEFAULT_WORKER_PORT = 3002;

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("[enrichment] Starting enrichment worker...");

  // Load config from environment
  const config = loadConfig();

  // Create Redis connection (shared between worker instances)
  const redis = createRedisConnectionFromConfig(config);

  // Create Supabase service client
  const supabase = createServiceClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  // Create the job processor
  const processor = createProcessor(supabase);

  // Create and start the BullMQ worker
  const worker = createWorker<EnrichmentJobData>(
    QUEUE_NAME,
    processor,
    redis,
    { concurrency: 5 },
  );

  worker.on("completed", (job) => {
    console.log(`[enrichment] Job ${job.id} completed for bookmark ${job.data.bookmarkId}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[enrichment] Job ${job?.id} failed:`, err.message);
  });

  // Start health endpoint
  const port = parseInt(process.env.WORKER_PORT ?? String(DEFAULT_WORKER_PORT), 10);
  const server = startHealthServer(port);

  console.log(`[enrichment] Worker listening on queue "${QUEUE_NAME}" with concurrency 5`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("[enrichment] Shutting down...");
    await worker.close();
    server.close();
    await redis.quit();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("[enrichment] Fatal error:", err);
  process.exit(1);
});
