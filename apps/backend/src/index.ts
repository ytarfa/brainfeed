import "./config/env"; // validate env vars at startup
import express from "express";
import cors from "cors";
import helmet from "helmet";
import {
  contextMiddleware,
  requestLoggerMiddleware,
  errorHandlerMiddleware,
} from "@brain-feed/logger";
import { authMiddleware } from "./middleware/auth";
import { logger } from "./lib/logger";
import bookmarksRouter from "./routes/bookmarks";
import spacesRouter from "./routes/spaces";
import rulesRouter from "./routes/rules";
import membersRouter from "./routes/members";
import activityRouter from "./routes/activity";
import searchRouter from "./routes/search";
import publicRouter from "./routes/public";
import authRouter from "./routes/auth";
import settingsRouter from "./routes/settings";
import digestRouter from "./routes/digest";

const app = express();
const PORT = process.env.PORT ?? 3001;

// --- Correlation & logging middleware (must be first) ---
app.use(contextMiddleware());
app.use(requestLoggerMiddleware(logger));

app.use(helmet());
const allowedOrigins = [
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL?.split(",").map((u) => u.trim()) ?? []),
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (curl, server-to-server)
      if (!origin) return callback(null, true);
      // Exact match (localhost, production domain)
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow all Vercel preview deployments
      if (/\.vercel\.app$/.test(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Health check (Railway healthcheck hits "/" by default)
app.get("/", (_req, res) => res.json({ status: "ok" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Public routes (no auth)
app.use("/api/v1/public", publicRouter);
app.use("/api/v1/auth", authRouter);

// Authenticated routes
app.use("/api/v1", authMiddleware);
app.use("/api/v1/bookmarks", bookmarksRouter);
app.use("/api/v1/spaces", spacesRouter);
app.use("/api/v1/spaces/:spaceId/rules", rulesRouter);
app.use("/api/v1/spaces/:spaceId/members", membersRouter);
app.use("/api/v1/spaces/:spaceId/activity", activityRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/digest", digestRouter);

// --- Error handler (must be last) ---
app.use(errorHandlerMiddleware(logger));

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Brainfeed backend started");
});
