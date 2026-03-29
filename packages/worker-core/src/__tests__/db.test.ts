import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createServiceClient,
  updateEnrichmentStatus,
  writeEnrichedData,
  fetchBookmarkForProcessing,
} from "../db";
import type { EnrichedData } from "@brain-feed/types";

// Mock @supabase/supabase-js
const mockCreateClient = vi.fn().mockImplementation(() => ({
  from: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

describe("createServiceClient", () => {
  it("should create a Supabase client with the provided URL and key", () => {
    const client = createServiceClient(
      "https://test.supabase.co",
      "test-service-key",
    );

    expect(client).toBeDefined();
    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-service-key",
      expect.objectContaining({
        auth: { persistSession: false },
      }),
    );
  });
});

describe("updateEnrichmentStatus", () => {
  let mockClient: ReturnType<typeof createMockClient>;

  function createMockClient(error: unknown = null) {
    const updateFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error }),
    });
    return {
      from: vi.fn().mockReturnValue({ update: updateFn }),
      update: updateFn,
    };
  }

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it("should update the enrichment status successfully", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateEnrichmentStatus(mockClient as any, "bookmark-1", "processing");

    expect(mockClient.from).toHaveBeenCalledWith("bookmarks");
    expect(mockClient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        enrichment_status: "processing",
      }),
    );
  });

  it("should throw when the update fails", async () => {
    const errorClient = createMockClient({ message: "DB error" });

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateEnrichmentStatus(errorClient as any, "bookmark-1", "processing"),
    ).rejects.toThrow("Failed to update enrichment status for bookmark bookmark-1: DB error");
  });
});

describe("writeEnrichedData", () => {
  function createMockClient(error: unknown = null) {
    const updateFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error }),
    });
    return {
      from: vi.fn().mockReturnValue({ update: updateFn }),
      update: updateFn,
    };
  }

  it("should write enriched data and set status to completed", async () => {
    const mockClient = createMockClient();
    const enrichedData: EnrichedData = {
      summary: "Test summary",
      entities: [{ name: "Test", type: "concept" }],
      topics: ["testing"],
      metadata: null,
      processedAt: "2026-03-29T12:00:00Z",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await writeEnrichedData(mockClient as any, "bookmark-1", enrichedData);

    expect(mockClient.from).toHaveBeenCalledWith("bookmarks");
    expect(mockClient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        enriched_data: enrichedData,
        enrichment_status: "completed",
      }),
    );
  });

  it("should throw when the write fails", async () => {
    const errorClient = createMockClient({ message: "DB error" });
    const enrichedData: EnrichedData = {
      summary: null,
      entities: [],
      topics: [],
      metadata: null,
      processedAt: "2026-03-29T12:00:00Z",
    };

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      writeEnrichedData(errorClient as any, "bookmark-1", enrichedData),
    ).rejects.toThrow("Failed to write enriched data for bookmark bookmark-1: DB error");
  });
});

describe("fetchBookmarkForProcessing", () => {
  function createMockClient(data: unknown, error: unknown = null) {
    const singleFn = vi.fn().mockResolvedValue({ data, error });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    return {
      from: vi.fn().mockReturnValue({ select: selectFn }),
      select: selectFn,
      eq: eqFn,
      single: singleFn,
    };
  }

  it("should fetch a bookmark by ID", async () => {
    const bookmark = {
      id: "bookmark-1",
      url: "https://example.com",
      title: "Test",
      content_type: "link",
      source_type: "generic",
      raw_content: null,
    };
    const mockClient = createMockClient(bookmark);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await fetchBookmarkForProcessing(mockClient as any, "bookmark-1");

    expect(result).toEqual(bookmark);
    expect(mockClient.from).toHaveBeenCalledWith("bookmarks");
    expect(mockClient.select).toHaveBeenCalledWith("id, url, title, content_type, source_type, raw_content");
  });

  it("should return null when bookmark is not found", async () => {
    const mockClient = createMockClient(null, { code: "PGRST116", message: "Not found" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await fetchBookmarkForProcessing(mockClient as any, "nonexistent");

    expect(result).toBeNull();
  });

  it("should throw on other errors", async () => {
    const mockClient = createMockClient(null, { code: "OTHER", message: "Server error" });

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchBookmarkForProcessing(mockClient as any, "bookmark-1"),
    ).rejects.toThrow("Failed to fetch bookmark bookmark-1: Server error");
  });
});
