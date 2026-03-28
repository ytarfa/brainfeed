import "./config/env"; // validate env vars at startup
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import bookmarksRouter from "./routes/bookmarks";
import spacesRouter from "./routes/spaces";
import rulesRouter from "./routes/rules";
import membersRouter from "./routes/members";
import activityRouter from "./routes/activity";
import syncSourcesRouter from "./routes/syncSources";
import searchRouter from "./routes/search";
import publicRouter from "./routes/public";
import settingsRouter from "./routes/settings";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.FRONTEND_URL ?? "http://localhost:3000",
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Public routes (no auth)
app.use("/api/v1/public", publicRouter);

// Authenticated routes
app.use("/api/v1", authMiddleware);
app.use("/api/v1/bookmarks", bookmarksRouter);
app.use("/api/v1/spaces", spacesRouter);
app.use("/api/v1/spaces/:spaceId/rules", rulesRouter);
app.use("/api/v1/spaces/:spaceId/members", membersRouter);
app.use("/api/v1/spaces/:spaceId/activity", activityRouter);
app.use("/api/v1/sync-sources", syncSourcesRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/settings", settingsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Brainfeed backend running on http://localhost:${PORT}`);
});
