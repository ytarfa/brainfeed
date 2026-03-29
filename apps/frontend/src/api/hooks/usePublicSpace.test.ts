import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { createHookWrapper } from "../../test/test-utils";
import { usePublicSpace, publicSpaceKeys } from "./usePublicSpace";

vi.mock("../client", () => ({
  apiGet: vi.fn(),
}));

import { apiGet } from "../client";

const mockPublicSpace = {
  space: {
    id: "s1",
    name: "Tech Resources",
    description: "Public tech bookmarks",
    created_at: "2025-01-01T00:00:00Z",
  },
  bookmarks: {
    data: [
      {
        id: "b1",
        title: "React Docs",
        description: "Official React docs",
        url: "https://react.dev",
        content_type: "link",
        source_type: "web",
        thumbnail_url: null,
        tags: ["react"],
        created_at: "2025-01-10T00:00:00Z",
        bookmark_spaces: [{ space_id: "s1" }],
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
  },
};

describe("publicSpaceKeys", () => {
  it("generates correct key hierarchy", () => {
    expect(publicSpaceKeys.all).toEqual(["publicSpace"]);
    expect(publicSpaceKeys.detail("abc123")).toEqual(["publicSpace", "abc123", {}]);
    expect(publicSpaceKeys.detail("abc123", { page: 2 })).toEqual([
      "publicSpace",
      "abc123",
      { page: 2 },
    ]);
  });
});

describe("usePublicSpace", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("fetches a public space by share token", async () => {
    vi.mocked(apiGet).mockResolvedValue(mockPublicSpace);

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => usePublicSpace("abc123"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledWith("/api/v1/public/spaces/abc123", {
      page: undefined,
      limit: undefined,
    });
    expect(result.current.data?.space.name).toBe("Tech Resources");
    expect(result.current.data?.bookmarks.data).toHaveLength(1);
  });

  it("passes pagination params", async () => {
    vi.mocked(apiGet).mockResolvedValue(mockPublicSpace);

    const { wrapper } = createHookWrapper();
    renderHook(() => usePublicSpace("abc123", { page: 2, limit: 10 }), { wrapper });

    await waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith("/api/v1/public/spaces/abc123", {
        page: 2,
        limit: 10,
      }),
    );
  });

  it("is disabled when shareToken is undefined", () => {
    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => usePublicSpace(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(apiGet).not.toHaveBeenCalled();
  });
});
