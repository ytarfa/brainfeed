import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BookmarkForProcessing } from "@brain-feed/worker-core";

// ---------------------------------------------------------------------------
// Mock worker-core DB helpers before importing processor
// ---------------------------------------------------------------------------

const mockUpdateEnrichmentStatus = vi.fn().mockResolvedValue(undefined);
const mockWriteEnrichedData = vi.fn().mockResolvedValue(undefined);
const mockFetchBookmarkForProcessing = vi.fn();

vi.mock("@brain-feed/worker-core", () => ({
  updateEnrichmentStatus: (...args: unknown[]) => mockUpdateEnrichmentStatus(...args),
  writeEnrichedData: (...args: unknown[]) => mockWriteEnrichedData(...args),
  fetchBookmarkForProcessing: (...args: unknown[]) => mockFetchBookmarkForProcessing(...args),
}));

// Mock the pipeline
const mockRunPipeline = vi.fn();
vi.mock("../pipeline", () => ({
  runPipeline: (...args: unknown[]) => mockRunPipeline(...args),
}));

import { createProcessor } from "../processor";
import type { EnrichmentJobData } from "../processor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fakeSupabase = {} as Parameters<typeof createProcessor>[0];

function makeJob(data: Partial<EnrichmentJobData> = {}) {
  return {
    id: "job-123",
    data: {
      bookmarkId: "bk-1",
      userId: "user-1",
      contentType: "link",
      sourceType: "generic",
      url: "https://example.com",
      ...data,
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

const fakeBookmark: BookmarkForProcessing = {
  id: "bk-1",
  url: "https://example.com",
  title: "Example",
  content_type: "link",
  source_type: "generic",
  raw_content: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createProcessor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes a link bookmark through the pipeline", async () => {
    mockFetchBookmarkForProcessing.mockResolvedValue(fakeBookmark);
    const fakeResult = {
      summary: null,
      entities: [],
      topics: [],
      metadata: null,
      processedAt: "2026-01-01T00:00:00.000Z",
    };
    mockRunPipeline.mockResolvedValue(fakeResult);

    const processor = createProcessor(fakeSupabase);
    await processor(makeJob());

    expect(mockUpdateEnrichmentStatus).toHaveBeenCalledWith(fakeSupabase, "bk-1", "processing");
    expect(mockFetchBookmarkForProcessing).toHaveBeenCalledWith(fakeSupabase, "bk-1");
    expect(mockRunPipeline).toHaveBeenCalledWith(fakeBookmark);
    expect(mockWriteEnrichedData).toHaveBeenCalledWith(fakeSupabase, "bk-1", fakeResult);
  });

  it("processes a github bookmark through the pipeline", async () => {
    const githubBookmark = { ...fakeBookmark, source_type: "github" as const, url: "https://github.com/user/repo" };
    mockFetchBookmarkForProcessing.mockResolvedValue(githubBookmark);
    mockRunPipeline.mockResolvedValue({ summary: null, entities: [], topics: [], metadata: null, processedAt: "t" });

    const processor = createProcessor(fakeSupabase);
    await processor(makeJob({ sourceType: "github", url: "https://github.com/user/repo" }));

    expect(mockUpdateEnrichmentStatus).toHaveBeenCalledWith(fakeSupabase, "bk-1", "processing");
    expect(mockRunPipeline).toHaveBeenCalled();
  });

  it("processes a youtube bookmark through the pipeline", async () => {
    const ytBookmark = { ...fakeBookmark, source_type: "youtube" as const, url: "https://youtube.com/watch?v=abc" };
    mockFetchBookmarkForProcessing.mockResolvedValue(ytBookmark);
    mockRunPipeline.mockResolvedValue({ summary: null, entities: [], topics: [], metadata: null, processedAt: "t" });

    const processor = createProcessor(fakeSupabase);
    await processor(makeJob({ sourceType: "youtube", url: "https://youtube.com/watch?v=abc" }));

    expect(mockUpdateEnrichmentStatus).toHaveBeenCalledWith(fakeSupabase, "bk-1", "processing");
    expect(mockRunPipeline).toHaveBeenCalled();
  });

  it("sets failed status when bookmark not found", async () => {
    mockFetchBookmarkForProcessing.mockResolvedValue(null);

    const processor = createProcessor(fakeSupabase);
    await processor(makeJob());

    expect(mockUpdateEnrichmentStatus).toHaveBeenCalledWith(fakeSupabase, "bk-1", "processing");
    expect(mockUpdateEnrichmentStatus).toHaveBeenCalledWith(fakeSupabase, "bk-1", "failed");
    expect(mockRunPipeline).not.toHaveBeenCalled();
  });

  it("sets failed status and re-throws on pipeline error", async () => {
    mockFetchBookmarkForProcessing.mockResolvedValue(fakeBookmark);
    mockRunPipeline.mockRejectedValue(new Error("Pipeline boom"));

    const processor = createProcessor(fakeSupabase);

    await expect(processor(makeJob())).rejects.toThrow("Pipeline boom");
    expect(mockUpdateEnrichmentStatus).toHaveBeenCalledWith(fakeSupabase, "bk-1", "failed");
  });
});
