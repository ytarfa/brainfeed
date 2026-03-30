import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  publishEnrichmentJob,
  _resetQueue,
  _setQueue,
} from "../lib/enrichmentQueue";

// ---------------------------------------------------------------------------
// Mock @brain-feed/worker-core so no real Redis connection is created
// ---------------------------------------------------------------------------

vi.mock("@brain-feed/worker-core", () => ({
  createRedisConnection: vi.fn(() => ({})),
  createQueue: vi.fn(() => ({
    add: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
  })),
}));

// Mock @brain-feed/logger so no real logger is created
vi.mock("@brain-feed/logger", () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
  return {
    createLogger: vi.fn(() => mockLogger),
    getRequestId: vi.fn(() => "test-request-id"),
  };
});

describe("enrichmentQueue", () => {
  const samplePayload = {
    bookmarkId: "bk-123",
    userId: "usr-456",
    contentType: "link" as const,
    sourceType: "github" as const,
    url: "https://github.com/example/repo",
  };

  beforeEach(() => {
    _resetQueue();
    vi.restoreAllMocks();
  });

  it("publishes a job with the correct payload including requestId", async () => {
    const addFn = vi.fn().mockResolvedValue({ id: "job-1" });
    _setQueue({ add: addFn });

    await publishEnrichmentJob(samplePayload);

    expect(addFn).toHaveBeenCalledOnce();
    expect(addFn).toHaveBeenCalledWith(
      "enrich",
      { ...samplePayload, requestId: "test-request-id" },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  });

  it("does not throw when the queue add fails (fire-and-forget)", async () => {
    const addFn = vi.fn().mockRejectedValue(new Error("Redis down"));
    _setQueue({ add: addFn });

    // Should not throw
    await expect(publishEnrichmentJob(samplePayload)).resolves.toBeUndefined();
    expect(addFn).toHaveBeenCalledOnce();
  });

  it("logs an error via the logger when the queue add fails", async () => {
    const addFn = vi.fn().mockRejectedValue(new Error("Connection refused"));
    _setQueue({ add: addFn });

    // Import the mocked logger to check it was called
    const { createLogger } = await import("@brain-feed/logger");
    const mockLogger = (createLogger as unknown as ReturnType<typeof vi.fn>)() as Record<string, ReturnType<typeof vi.fn>>;

    await publishEnrichmentJob(samplePayload);

    expect(mockLogger.error).toHaveBeenCalled();
  });

  it("publishes jobs with null sourceType", async () => {
    const addFn = vi.fn().mockResolvedValue({ id: "job-2" });
    _setQueue({ add: addFn });

    const genericPayload = {
      bookmarkId: "bk-789",
      userId: "usr-456",
      contentType: "link" as const,
      sourceType: null,
      url: "https://example.com/page",
    };

    await publishEnrichmentJob(genericPayload);

    expect(addFn).toHaveBeenCalledWith("enrich", { ...genericPayload, requestId: "test-request-id" }, expect.any(Object));
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
