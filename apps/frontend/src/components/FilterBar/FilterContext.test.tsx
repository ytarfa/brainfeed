import React from "react";
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import FilterProvider, { useFilterContext } from "./FilterContext";
import type { Bookmark } from "../../data/mock";

// --- Helper: wrap in providers with optional initial URL ---

function createWrapper(initialEntry = "/") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <FilterProvider>{children}</FilterProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: "b1",
    title: "Test",
    url: "https://example.com",
    description: null,
    notes: null,
    content_type: "link",
    source_type: "generic",
    tags: [],
    thumbnail_url: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    user_id: "u1",
    spaceId: "s1",
    savedAt: "Jan 1, 2025",
    raw_content: null,
    file_path: null,
    enriched_data: null,
    enrichment_status: "completed",
    digest_status: null,
    source_name: null,
    source_id: null,
    published_at: null,
    expires_at: null,
    ...overrides,
  };
}

// --- Tests ---

describe("useFilterContext", () => {
  it("throws when used outside FilterProvider", () => {
    expect(() => {
      renderHook(() => useFilterContext(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <MemoryRouter>{children as React.ReactElement}</MemoryRouter>
        ),
      });
    }).toThrow("useFilterContext must be used within a FilterProvider");
  });
});

describe("FilterProvider — defaults", () => {
  it("uses default values when no URL params", () => {
    const wrapper = createWrapper("/");
    const { result } = renderHook(() => useFilterContext(), { wrapper });

    expect(result.current.source).toBeNull();
    expect(result.current.tags).toEqual([]);
    expect(result.current.sort).toBe("created_at");
    expect(result.current.order).toBe("desc");
    expect(result.current.hasActiveFilters).toBe(false);
  });
});

describe("FilterProvider — URL sync (read)", () => {
  it("reads source from URL", () => {
    const wrapper = createWrapper("/?source=github");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.source).toBe("github");
  });

  it("reads tags from URL", () => {
    const wrapper = createWrapper("/?tags=react,typescript");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.tags).toEqual(["react", "typescript"]);
  });

  it("reads sort and order from URL", () => {
    const wrapper = createWrapper("/?sort=title&order=asc");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.sort).toBe("title");
    expect(result.current.order).toBe("asc");
  });

  it("ignores invalid source values", () => {
    const wrapper = createWrapper("/?source=invalid");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.source).toBeNull();
  });

  it("ignores invalid sort values", () => {
    const wrapper = createWrapper("/?sort=random");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.sort).toBe("created_at"); // default
  });

  it("reads all params together", () => {
    const wrapper = createWrapper("/?source=youtube&tags=react,typescript&sort=title&order=asc");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.source).toBe("youtube");
    expect(result.current.tags).toEqual(["react", "typescript"]);
    expect(result.current.sort).toBe("title");
    expect(result.current.order).toBe("asc");
    expect(result.current.hasActiveFilters).toBe(true);
  });
});

describe("FilterProvider — setters", () => {
  it("setSource updates source", () => {
    const wrapper = createWrapper("/");
    const { result } = renderHook(() => useFilterContext(), { wrapper });

    act(() => result.current.setSource("github"));
    expect(result.current.source).toBe("github");

    act(() => result.current.setSource(null));
    expect(result.current.source).toBeNull();
  });

  it("toggleTag adds and removes tags", () => {
    const wrapper = createWrapper("/");
    const { result } = renderHook(() => useFilterContext(), { wrapper });

    act(() => result.current.toggleTag("react"));
    expect(result.current.tags).toEqual(["react"]);

    act(() => result.current.toggleTag("typescript"));
    expect(result.current.tags).toEqual(["react", "typescript"]);

    act(() => result.current.toggleTag("react"));
    expect(result.current.tags).toEqual(["typescript"]);
  });

  it("removeTag removes a specific tag", () => {
    const wrapper = createWrapper("/?tags=react,typescript");
    const { result } = renderHook(() => useFilterContext(), { wrapper });

    act(() => result.current.removeTag("react"));
    expect(result.current.tags).toEqual(["typescript"]);
  });

  it("setSort updates sort", () => {
    const wrapper = createWrapper("/");
    const { result } = renderHook(() => useFilterContext(), { wrapper });

    act(() => result.current.setSort("title"));
    expect(result.current.sort).toBe("title");
  });

  it("setOrder updates order", () => {
    const wrapper = createWrapper("/");
    const { result } = renderHook(() => useFilterContext(), { wrapper });

    act(() => result.current.setOrder("asc"));
    expect(result.current.order).toBe("asc");
  });

  it("clearAll resets all filters to defaults", () => {
    const wrapper = createWrapper("/?source=github&tags=react&sort=title&order=asc");
    const { result } = renderHook(() => useFilterContext(), { wrapper });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => result.current.clearAll());

    expect(result.current.source).toBeNull();
    expect(result.current.tags).toEqual([]);
    expect(result.current.sort).toBe("created_at");
    expect(result.current.order).toBe("desc");
    expect(result.current.hasActiveFilters).toBe(false);
  });
});

describe("FilterProvider — serverParams", () => {
  it("includes type when source is set", () => {
    const wrapper = createWrapper("/?source=youtube&sort=title&order=asc");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.serverParams).toEqual({
      type: "youtube",
      sort: "title",
      order: "asc",
    });
  });

  it("omits type when no source filter", () => {
    const wrapper = createWrapper("/");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.serverParams).toEqual({
      sort: "created_at",
      order: "desc",
    });
    expect(result.current.serverParams).not.toHaveProperty("type");
  });
});

describe("FilterProvider — filterByTags", () => {
  it("returns all bookmarks when no tags selected", () => {
    const wrapper = createWrapper("/");
    const { result } = renderHook(() => useFilterContext(), { wrapper });

    const bookmarks = [
      makeBookmark({ id: "b1", tags: [{ id: "react", label: "react" }] }),
      makeBookmark({ id: "b2", tags: [] }),
    ];

    expect(result.current.filterByTags(bookmarks)).toHaveLength(2);
  });

  it("filters with AND logic (must have ALL selected tags)", () => {
    const wrapper = createWrapper("/?tags=react,typescript");
    const { result } = renderHook(() => useFilterContext(), { wrapper });

    const bookmarks = [
      makeBookmark({
        id: "b1",
        tags: [{ id: "react", label: "react" }, { id: "typescript", label: "typescript" }],
      }),
      makeBookmark({
        id: "b2",
        tags: [{ id: "react", label: "react" }],
      }),
      makeBookmark({
        id: "b3",
        tags: [{ id: "typescript", label: "typescript" }, { id: "vue", label: "vue" }],
      }),
      makeBookmark({
        id: "b4",
        tags: [{ id: "react", label: "react" }, { id: "typescript", label: "typescript" }, { id: "node", label: "node" }],
      }),
    ];

    const filtered = result.current.filterByTags(bookmarks);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((b) => b.id)).toEqual(["b1", "b4"]);
  });

  it("returns empty when no bookmarks match all tags", () => {
    const wrapper = createWrapper("/?tags=react,vue,svelte");
    const { result } = renderHook(() => useFilterContext(), { wrapper });

    const bookmarks = [
      makeBookmark({
        id: "b1",
        tags: [{ id: "react", label: "react" }, { id: "vue", label: "vue" }],
      }),
    ];

    expect(result.current.filterByTags(bookmarks)).toHaveLength(0);
  });
});

describe("FilterProvider — hasActiveFilters", () => {
  it("is false when all defaults", () => {
    const wrapper = createWrapper("/");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("is true when source is set", () => {
    const wrapper = createWrapper("/?source=github");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("is true when tags are set", () => {
    const wrapper = createWrapper("/?tags=react");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("is true when sort differs from default", () => {
    const wrapper = createWrapper("/?sort=title");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("is true when order differs from default", () => {
    const wrapper = createWrapper("/?order=asc");
    const { result } = renderHook(() => useFilterContext(), { wrapper });
    expect(result.current.hasActiveFilters).toBe(true);
  });
});
