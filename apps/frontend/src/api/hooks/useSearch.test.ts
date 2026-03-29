import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { createHookWrapper } from "../../test/test-utils";
import { useSearch, searchKeys } from "./useSearch";

vi.mock("../client", () => ({
  apiGet: vi.fn(),
}));

import { apiGet } from "../client";

const mockSearchResults = {
  data: [
    {
      id: "b1",
      title: "React Hooks Guide",
      url: "https://react.dev/hooks",
      description: "Learn about React hooks",
      content_type: "link",
      source_type: "web",
      tags: ["react"],
      thumbnail_url: null,
      created_at: "2025-01-01T00:00:00Z",
      bookmark_spaces: [
        { space_id: "s1", spaces: { id: "s1", name: "Tech" } },
      ],
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

describe("searchKeys", () => {
  it("generates correct key hierarchy", () => {
    expect(searchKeys.all).toEqual(["search"]);
    expect(searchKeys.results({ q: "react" })).toEqual(["search", { q: "react" }]);
  });
});

describe("useSearch", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("fetches search results when query is non-empty", async () => {
    vi.mocked(apiGet).mockResolvedValue(mockSearchResults);

    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useSearch({ q: "react" }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledWith("/api/v1/search", {
      q: "react",
      type: undefined,
      space_id: undefined,
      page: undefined,
      limit: undefined,
    });
    expect(result.current.data?.data).toHaveLength(1);
  });

  it("passes all filter params to API", async () => {
    vi.mocked(apiGet).mockResolvedValue(mockSearchResults);

    const { wrapper } = createHookWrapper();
    renderHook(
      () =>
        useSearch({
          q: "react",
          type: "link",
          space_id: "s1",
          page: 1,
          limit: 10,
        }),
      { wrapper },
    );

    await waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith("/api/v1/search", {
        q: "react",
        type: "link",
        space_id: "s1",
        page: 1,
        limit: 10,
      }),
    );
  });

  it("is disabled when query is empty", () => {
    const { wrapper } = createHookWrapper();
    const { result } = renderHook(() => useSearch({ q: "" }), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(apiGet).not.toHaveBeenCalled();
  });
});
