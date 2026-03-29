/**
 * Standalone script to test the enrichment pipeline without BullMQ, Redis,
 * or Supabase. Pass a URL (or use the default) and see the LangGraph
 * fetch + summarize output printed to the console.
 *
 * Usage:
 *   pnpm --filter @brain-feed/worker-enrichment test:pipeline
 *   pnpm --filter @brain-feed/worker-enrichment test:pipeline "https://example.com/article"
 *
 * Env vars loaded from packages/worker-enrichment/.env (OPENROUTER_API_KEY,
 * LANGSMITH_* for tracing).
 */

import dotenv from "dotenv";
import path from "path";

// Load .env from this package's directory regardless of CWD
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { runPipeline } from "./pipeline";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_URL = "https://www.paulgraham.com/greatwork.html";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const url = process.argv[2] || DEFAULT_URL;

  console.log("=".repeat(60));
  console.log("Enrichment Pipeline — Isolated Test");
  console.log("=".repeat(60));
  console.log(`URL:        ${url}`);
  console.log(`LangSmith:  ${process.env.LANGSMITH_TRACING === "true" ? "enabled" : "disabled"}`);
  console.log(`Project:    ${process.env.LANGSMITH_PROJECT ?? "(not set)"}`);
  console.log("=".repeat(60));

  // Build a minimal BookmarkForProcessing — the pipeline only needs these fields
  const bookmark: BookmarkForProcessing = {
    id: "test-" + Date.now(),
    url,
    title: null,
    content_type: "link",
    source_type: null,
    raw_content: null,
  };

  console.log("\n[1/2] Fetching and extracting page content...");
  const start = Date.now();

  const result = await runPipeline(bookmark);

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`[2/2] Pipeline completed in ${elapsed}s\n`);

  console.log("-".repeat(60));
  console.log("SUMMARY");
  console.log("-".repeat(60));
  console.log(result.summary ?? "(no summary)");

  console.log("\n" + "-".repeat(60));
  console.log("ENTITIES");
  console.log("-".repeat(60));
  if (result.entities.length === 0) {
    console.log("(none)");
  } else {
    for (const e of result.entities) {
      console.log(`  ${e.name} (${e.type})`);
    }
  }

  console.log("\n" + "-".repeat(60));
  console.log("TOPICS");
  console.log("-".repeat(60));
  if (result.topics.length === 0) {
    console.log("(none)");
  } else {
    console.log(`  ${result.topics.join(", ")}`);
  }

  console.log("\n" + "-".repeat(60));
  console.log("RAW RESULT (JSON)");
  console.log("-".repeat(60));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("\nPipeline failed:", err);
  process.exit(1);
});
