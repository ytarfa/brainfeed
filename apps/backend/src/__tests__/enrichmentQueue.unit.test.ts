import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  publishEnrichmentJob,
  _resetQueue,
  _setQueue,
} from "../lib/enrichmentQueue";
import type { EnrichmentJobPayload } from "../lib/enrichmentQueue";

// ---------------------------------------------------------------------------
// Mock @brain-feed/worker-core so no real Redis connection is created
// ---------------------------------------------------------------------------

vi.mock("@brain-feed/worker-core", () => ({
  createRedisConnection: vi.fn(() => ({})),
  createQueue: vi.fn(() => ({
    add: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
  })),
}));

describe("enrichmentQueue", () => {
  const samplePayload: EnrichmentJobPayload = {
    bookmarkId: "bk-123",
    userId: "usr-456",
    contentType: "link",
    sourceType: "github",
    url: "https://github.com/example/repo",
  };

  beforeEach(() => {
    _resetQueue();
    vi.restoreAllMocks();
  });

  it("publishes a job with the correct payload and options", async () => {
    const addFn = vi.fn().mockResolvedValue({ id: "job-1" });
    _setQueue({ add: addFn });

    await publishEnrichmentJob(samplePayload);

    expect(addFn).toHaveBeenCalledOnce();
    expect(addFn).toHaveBeenCalledWith("enrich", samplePayload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  });

  it("does not throw when the queue add fails (fire-and-forget)", async () => {
    const addFn = vi.fn().mockRejectedValue(new Error("Redis down"));
    _setQueue({ add: addFn });

    // Should not throw
    await expect(publishEnrichmentJob(samplePayload)).resolves.toBeUndefined();
    expect(addFn).toHaveBeenCalledOnce();
  });

  it("logs an error when the queue add fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const addFn = vi.fn().mockRejectedValue(new Error("Connection refused"));
    _setQueue({ add: addFn });

    await publishEnrichmentJob(samplePayload);

    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[enrichmentQueue] Failed to publish job:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("publishes jobs with null url and sourceType", async () => {
    const addFn = vi.fn().mockResolvedValue({ id: "job-2" });
    _setQueue({ add: addFn });

    const notePayload: EnrichmentJobPayload = {
      bookmarkId: "bk-789",
      userId: "usr-456",
      contentType: "note",
      sourceType: null,
      url: null,
    };

    await publishEnrichmentJob(notePayload);

    expect(addFn).toHaveBeenCalledWith("enrich", notePayload, expect.any(Object));
  });

  it("lazy-initialises the queue via worker-core on first call when no queue is injected", async () => {
    // Don't inject a queue — let it create one via the mocked worker-core
    _resetQueue();

    const { createRedisConnection, createQueue } = await import("@brain-feed/worker-core");

    await publishEnrichmentJob(samplePayload);

    expect(createRedisConnection).toHaveBeenCalledOnce();
    expect(createQueue).toHaveBeenCalledWith("enrichment", expect.anything());
  });
});
