import express from "express";
import type { Server } from "http";
import type { Logger } from "@brain-feed/logger";

const QUEUE_NAME = "enrichment";

/**
 * Start a minimal HTTP server for health checks.
 *
 * Responds to `GET /health` with `{ status: "ok", queue, timestamp }`.
 * Returns the `http.Server` instance so the caller can close it on shutdown.
 */
export function startHealthServer(port: number, logger?: Logger): Server {
  const app = express();

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      queue: QUEUE_NAME,
      timestamp: new Date().toISOString(),
    });
  });

  const server = app.listen(port, () => {
    if (logger) {
      logger.info({ port }, "Health endpoint listening");
    }
  });

  return server;
}
