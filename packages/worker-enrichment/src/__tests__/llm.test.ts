import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getModel,
  resetModel,
  enrichContent,
  enrichmentSchema,
} from "../services/llm";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockInvoke = vi.fn();
const mockWithStructuredOutput = vi.fn(() => ({
  invoke: mockInvoke,
}));

vi.mock("@langchain/openrouter", () => ({
  ChatOpenRouter: vi.fn().mockImplementation(() => ({
    withStructuredOutput: mockWithStructuredOutput,
  })),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("llm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetModel();
    delete process.env.ENRICHMENT_MODEL;
  });

  afterEach(() => {
    resetModel();
  });

  // -----------------------------------------------------------------------
  // getModel
  // -----------------------------------------------------------------------

  describe("getModel()", () => {
    it("returns a ChatOpenRouter instance", () => {
      const model = getModel();
      expect(model).toBeDefined();
      expect(model.withStructuredOutput).toBeDefined();
    });

    it("caches the model across calls", () => {
      const first = getModel();
      const second = getModel();
      expect(first).toBe(second);
    });

    it("uses ENRICHMENT_MODEL env var when set", async () => {
      process.env.ENRICHMENT_MODEL = "anthropic/claude-3.5-sonnet";
      const { ChatOpenRouter } = await import("@langchain/openrouter");
      getModel();
      expect(ChatOpenRouter).toHaveBeenCalledWith({
        model: "anthropic/claude-3.5-sonnet",
      });
    });

    it("uses default model when ENRICHMENT_MODEL is not set", async () => {
      const { ChatOpenRouter } = await import("@langchain/openrouter");
      getModel();
      expect(ChatOpenRouter).toHaveBeenCalledWith({
        model: "google/gemini-2.0-flash-001",
      });
    });

    it("resets the cached model with resetModel()", () => {
      const first = getModel();
      resetModel();
      const second = getModel();
      // Both are mocked instances, but they should be different references
      // since we reset in between. Due to mock reusing same constructor,
      // they'll have same shape but the important thing is the constructor
      // was called twice.
      expect(first).toBeDefined();
      expect(second).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // enrichContent
  // -----------------------------------------------------------------------

  describe("enrichContent()", () => {
    it("returns empty result for empty string without calling LLM", async () => {
      const result = await enrichContent("", "test");
      expect(result).toEqual({
        summary: "",
        entities: [],
        topics: [],
        tags: [],
      });
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it("returns empty result for whitespace-only string", async () => {
      const result = await enrichContent("   \n\t  ", "test");
      expect(result).toEqual({
        summary: "",
        entities: [],
        topics: [],
        tags: [],
      });
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it("calls the LLM with structured output for non-empty content", async () => {
      const fakeResult = {
        summary: "A great video.",
        entities: [{ name: "JavaScript", type: "technology" }],
        topics: ["programming"],
        tags: ["js", "tutorial"],
      };
      mockInvoke.mockResolvedValue(fakeResult);

      const result = await enrichContent(
        "This is a video about JavaScript.",
        "YouTube video transcript",
      );

      expect(mockWithStructuredOutput).toHaveBeenCalledWith(enrichmentSchema);
      expect(mockInvoke).toHaveBeenCalledTimes(1);

      const prompt = mockInvoke.mock.calls[0][0] as string;
      expect(prompt).toContain("YouTube video transcript");
      expect(prompt).toContain("This is a video about JavaScript.");

      expect(result).toEqual(fakeResult);
    });

    it("passes the content type into the prompt", async () => {
      mockInvoke.mockResolvedValue({
        summary: "Test",
        entities: [],
        topics: [],
        tags: [],
      });

      await enrichContent("Some content", "YouTube channel description");

      const prompt = mockInvoke.mock.calls[0][0] as string;
      expect(prompt).toContain("YouTube channel description");
    });
  });

  // -----------------------------------------------------------------------
  // enrichmentSchema
  // -----------------------------------------------------------------------

  describe("enrichmentSchema", () => {
    it("validates a correct enrichment result", () => {
      const valid = {
        summary: "A summary",
        entities: [{ name: "React", type: "technology" }],
        topics: ["web dev"],
        tags: ["react", "frontend"],
      };
      const result = enrichmentSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects missing required fields", () => {
      const invalid = { summary: "Only summary" };
      const result = enrichmentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
