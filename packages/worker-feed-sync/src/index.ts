/**
 * Feed sync worker — library exports.
 *
 * This module re-exports provider functions and types for use by the backend.
 * The standalone worker entry point lives in `./main.ts`.
 */

// Re-export providers sub-package for use by backend routes
export {
  getFeedProvider,
  getAllFeedProviderMeta,
  resolveChannelId,
} from "./providers";

export type {
  FeedProvider,
  FeedProviderMeta,
  FeedItem,
  ConfigField,
  ConfigFieldOption,
} from "./providers";

export type { FeedSyncJobData } from "./types";
