import { createLogger } from "@brain-feed/logger";

/**
 * Shared logger instance for the backend application.
 * Reads LOG_LEVEL from environment (default: "info" in prod, "debug" in dev).
 * Uses pino-pretty for human-readable output in development.
 */
export const logger = createLogger({ name: "backend" });
