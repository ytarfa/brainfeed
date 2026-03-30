import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";

// ---------------------------------------------------------------------------
// Mocks — must be set up before importing the module under test
// ---------------------------------------------------------------------------

const mockSubgraphInvoke = vi.fn();

vi.mock("../enrichment-graph", () => ({
  enrichmentGraph: {
    invoke: (...args: unknown[]) => mockSubgraphInvoke(...args),
  },
}));

// Import after mocks are registered
import { runPipeline } from "../pipeline";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const fakeBookmark: BookmarkForProcessing = {
  id: "bk-1",
  url: "https://example.com",
  title: "Example Article",
  content_type: "link",
  source_type: "generic",
  raw_content: null,
};

const fakeEnrichedResult = {
  summary: "This is a summary of the example article.",
  entities: [{ name: "Example Corp", type: "organization" }],
  topics: ["technology", "web"],
  tags: ["tech", "web"],
  metadata: null,
  processedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("runPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubgraphInvoke.mockReset();
  });

  it("passes the bookmark to the enrichment subgraph and returns the result", async () => {
    mockSubgraphInvoke.mockResolvedValue({ result: fakeEnrichedResult });

    const result = await runPipeline(fakeBookmark);

    expect(mockSubgraphInvoke).toHaveBeenCalledTimes(1);
    const subgraphInput = mockSubgraphInvoke.mock.calls[0][0];
    expect(subgraphInput.bookmark).toBe(fakeBookmark);
    expect(subgraphInput.result).toBeNull();

    expect(result.summary).toBe("This is a summary of the example article.");
    expect(result.entities).toEqual([
      { name: "Example Corp", type: "organization" },
    ]);
    expect(result.topics).toEqual(["technology", "web"]);
    expect(result.tags).toEqual(["tech", "web"]);
    expect(result.metadata).toBeNull();
    expect(result.processedAt).toBeDefined();
  });

  it("propagates subgraph errors", async () => {
    mockSubgraphInvoke.mockRejectedValue(new Error("Subgraph failure"));

    await expect(runPipeline(fakeBookmark)).rejects.toThrow(
      "Subgraph failure",
    );

    expect(mockSubgraphInvoke).toHaveBeenCalledTimes(1);
  });

  it("returns a fresh processedAt timestamp on each call", async () => {
    let callCount = 0;
    mockSubgraphInvoke.mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        result: {
          ...fakeEnrichedResult,
          processedAt: new Date(Date.now() + callCount).toISOString(),
        },
      });
    });

    const result1 = await runPipeline(fakeBookmark);
    await new Promise((r) => setTimeout(r, 10));
    const result2 = await runPipeline(fakeBookmark);

    expect(result1.processedAt).not.toBe(result2.processedAt);
  });
});
