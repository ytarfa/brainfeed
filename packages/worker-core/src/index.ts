// Worker-core: shared infrastructure for BullMQ workers
// Redis connection, queue factories, Supabase DB helpers

export { loadConfig } from "./config";
export type { WorkerCoreConfig } from "./config";

export { createRedisConnection, createRedisConnectionFromConfig } from "./redis";
export type { RedisConfig } from "./redis";

export { createQueue, createWorker } from "./queue";

export {
  createServiceClient,
  updateEnrichmentStatus,
  writeEnrichedData,
  fetchBookmarkForProcessing,
} from "./db";
export type { BookmarkForProcessing } from "./db";
