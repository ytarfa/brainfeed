import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";

// ---------------------------------------------------------------------------
// Mocks — must be set up before importing the module under test
// ---------------------------------------------------------------------------

const mockInvoke = vi.fn();

vi.mock("@langchain/openrouter", () => ({
  ChatOpenRouter: vi.fn().mockImplementation(() => ({
    withStructuredOutput: vi.fn().mockReturnValue({
      invoke: mockInvoke,
    }),
  })),
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

const fakeLlmResponse = {
  summary: "This is a summary of the example article.",
  entities: [{ name: "Example Corp", type: "organization" }],
  topics: ["technology", "web"],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("runPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockReset();
  });

  it("fetches the URL, calls the LLM, and returns enriched data", async () => {
    // Mock global fetch to return HTML
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          "<html><body><article>Example article content about technology.</article></body></html>",
        ),
    });
    vi.stubGlobal("fetch", mockFetch);

    mockInvoke.mockResolvedValue(fakeLlmResponse);

    const result = await runPipeline(fakeBookmark);

    // Verify fetch was called with the bookmark URL
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": expect.stringContaining("BrainFeedBot"),
        }),
      }),
    );

    // Verify LLM was invoked
    expect(mockInvoke).toHaveBeenCalledTimes(1);

    // Verify the result has the LLM output
    expect(result.summary).toBe("This is a summary of the example article.");
    expect(result.entities).toEqual([
      { name: "Example Corp", type: "organization" },
    ]);
    expect(result.topics).toEqual(["technology", "web"]);
    expect(result.metadata).toBeNull();
    expect(result.processedAt).toBeDefined();
    expect(new Date(result.processedAt).toISOString()).toBe(
      result.processedAt,
    );
  });

  it("uses raw_content directly without HTTP fetch", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    mockInvoke.mockResolvedValue(fakeLlmResponse);

    const bookmarkWithContent: BookmarkForProcessing = {
      ...fakeBookmark,
      raw_content: "This is raw note content.",
    };

    const result = await runPipeline(bookmarkWithContent);

    // fetch should NOT be called when raw_content is present
    expect(mockFetch).not.toHaveBeenCalled();

    // LLM should still be invoked
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(result.summary).toBe(fakeLlmResponse.summary);
  });

  it("returns null summary when URL is missing and no raw_content", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const bookmarkNoUrl: BookmarkForProcessing = {
      ...fakeBookmark,
      url: null,
      raw_content: null,
    };

    const result = await runPipeline(bookmarkNoUrl);

    // No fetch, no LLM call
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockInvoke).not.toHaveBeenCalled();

    // Should return a null/empty result
    expect(result.summary).toBeNull();
    expect(result.entities).toEqual([]);
    expect(result.topics).toEqual([]);
  });

  it("returns null summary when HTTP fetch fails", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await runPipeline(fakeBookmark);

    // Fetch was attempted but failed — no LLM call
    expect(mockFetch).toHaveBeenCalled();
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(result.summary).toBeNull();
  });

  it("returns null summary when LLM call fails", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html><body>Some content</body></html>"),
    });
    vi.stubGlobal("fetch", mockFetch);

    mockInvoke.mockRejectedValue(new Error("LLM API error"));

    const result = await runPipeline(fakeBookmark);

    // Both fetch and LLM were attempted
    expect(mockFetch).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalled();

    // Should gracefully return null summary
    expect(result.summary).toBeNull();
    expect(result.entities).toEqual([]);
    expect(result.processedAt).toBeDefined();
  });

  it("returns a fresh processedAt timestamp on each call", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve("<html><body>Content</body></html>"),
    });
    vi.stubGlobal("fetch", mockFetch);

    mockInvoke.mockResolvedValue(fakeLlmResponse);

    const result1 = await runPipeline(fakeBookmark);
    await new Promise((r) => setTimeout(r, 10));
    const result2 = await runPipeline(fakeBookmark);

    expect(result1.processedAt).not.toBe(result2.processedAt);
  });
});
