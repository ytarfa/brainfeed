import { describe, it, expect } from "vitest";
import { runPipeline } from "../pipeline";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";

describe("runPipeline", () => {
  const fakeBookmark: BookmarkForProcessing = {
    id: "bk-1",
    url: "https://example.com",
    title: "Example Article",
    content_type: "link",
    source_type: "generic",
    raw_content: null,
  };

  it("returns a valid EnrichedData object with placeholder values", async () => {
    const result = await runPipeline(fakeBookmark);

    expect(result).toBeDefined();
    expect(result.summary).toBeNull();
    expect(result.entities).toEqual([]);
    expect(result.topics).toEqual([]);
    expect(result.metadata).toBeNull();
    expect(result.processedAt).toBeDefined();
    expect(typeof result.processedAt).toBe("string");
    // Verify it's a valid ISO date
    expect(new Date(result.processedAt).toISOString()).toBe(result.processedAt);
  });

  it("returns a fresh processedAt timestamp on each call", async () => {
    const result1 = await runPipeline(fakeBookmark);
    // Small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 10));
    const result2 = await runPipeline(fakeBookmark);

    expect(result1.processedAt).not.toBe(result2.processedAt);
  });
});
