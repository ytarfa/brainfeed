import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { createHookWrapper } from "../../test/test-utils";
import { useTags, tagKeys } from "./useTags";

// Mock the API client
vi.mock("../client", () => ({
  apiGet: vi.fn(),
}));

import { apiGet } from "../client";

// --- Tests ---

describe("tagKeys", () => {
  it("generates correct key", () => {
    expect(tagKeys.all).toEqual(["tags"]);
  });
});

describe("useTags", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("fetches tags from /api/v1/tags", async () => {
    const mockTags = ["javascript", "react", "typescript"];
    vi.mocked(apiGet).mockResolvedValue(mockTags);

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useTags(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiGet).toHaveBeenCalledWith("/api/v1/tags");
    expect(result.current.data).toEqual(["javascript", "react", "typescript"]);
  });

  it("returns empty array when no tags exist", async () => {
    vi.mocked(apiGet).mockResolvedValue([]);

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useTags(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("handles error state", async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error("Network error"));

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useTags(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});
