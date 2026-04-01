import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import FilterBar from "./FilterBar";
import FilterProvider from "./FilterContext";

// ─── Mocks ────────────────────────────────────────────────

vi.mock("../../api/hooks", () => ({
  useTags: vi.fn(),
}));

import { useTags } from "../../api/hooks";
const mockUseTags = vi.mocked(useTags);

// ─── Helpers ──────────────────────────────────────────────

function createWrapper(initialEntry = "/") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <FilterProvider>
            {children}
          </FilterProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

function renderFilterBar(initialEntry = "/") {
  return render(
    <FilterBar>
      <FilterBar.SourcePills />
      <FilterBar.TagSelect />
      <FilterBar.Sort />
      <FilterBar.ActiveFilters />
    </FilterBar>,
    { wrapper: createWrapper(initialEntry) },
  );
}

// ═══════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════

describe("FilterBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTags.mockReturnValue({
      data: ["react", "typescript", "ml"],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useTags>);
  });

  // ─── SourcePills ────────────────────────────────────────

  describe("SourcePills", () => {
    it("renders All and all source type pills", () => {
      renderFilterBar();
      expect(screen.getByRole("radio", { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /github/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /youtube/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /article/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /instagram/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /generic/i })).toBeInTheDocument();
    });

    it("has All selected by default", () => {
      renderFilterBar();
      expect(screen.getByRole("radio", { name: /all/i })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("radio", { name: /github/i })).toHaveAttribute("aria-checked", "false");
    });

    it("selects a source type on click", () => {
      renderFilterBar();
      fireEvent.click(screen.getByRole("radio", { name: /github/i }));
      expect(screen.getByRole("radio", { name: /github/i })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("radio", { name: /all/i })).toHaveAttribute("aria-checked", "false");
    });

    it("deselects back to All on click", () => {
      renderFilterBar();
      fireEvent.click(screen.getByRole("radio", { name: /github/i }));
      fireEvent.click(screen.getByRole("radio", { name: /all/i }));
      expect(screen.getByRole("radio", { name: /all/i })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("radio", { name: /github/i })).toHaveAttribute("aria-checked", "false");
    });

    it("reads source from URL params", () => {
      renderFilterBar("/?source=youtube");
      expect(screen.getByRole("radio", { name: /youtube/i })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("radio", { name: /all/i })).toHaveAttribute("aria-checked", "false");
    });
  });

  // ─── TagSelect ──────────────────────────────────────────

  describe("TagSelect", () => {
    it("renders the tag trigger button", () => {
      renderFilterBar();
      expect(screen.getByRole("button", { name: /tags/i })).toBeInTheDocument();
    });

    it("hides when no tags available", () => {
      mockUseTags.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof useTags>);
      renderFilterBar();
      expect(screen.queryByRole("button", { name: /tags/i })).not.toBeInTheDocument();
    });

    it("opens dropdown on click and shows available tags", () => {
      renderFilterBar();
      fireEvent.click(screen.getByRole("button", { name: /tags/i }));
      expect(screen.getByRole("listbox", { name: /select tags/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /react/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /typescript/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /ml/i })).toBeInTheDocument();
    });

    it("selects a tag on click and shows chip", () => {
      renderFilterBar();
      fireEvent.click(screen.getByRole("button", { name: /tags/i }));
      fireEvent.click(screen.getByRole("option", { name: /react/i }));
      // Tag chips should appear (in TagSelect area + ActiveFilters area)
      expect(screen.getAllByText("react").length).toBeGreaterThanOrEqual(1);
      // Badge count should show 1
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("removes a tag via chip X button", () => {
      renderFilterBar("/?tags=react");
      // Should show chips for react (TagSelect + ActiveFilters)
      const removeButtons = screen.getAllByLabelText("Remove tag react");
      expect(removeButtons.length).toBeGreaterThanOrEqual(1);
      // Click the first remove button
      fireEvent.click(removeButtons[0]);
      // All chips should be gone
      expect(screen.queryByLabelText("Remove tag react")).not.toBeInTheDocument();
    });

    it("reads tags from URL params", () => {
      renderFilterBar("/?tags=react,typescript");
      // Should show badge count
      expect(screen.getByText("2")).toBeInTheDocument();
      // Should show remove buttons (may appear in both TagSelect and ActiveFilters)
      expect(screen.getAllByLabelText("Remove tag react").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByLabelText("Remove tag typescript").length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Sort ───────────────────────────────────────────────

  describe("Sort", () => {
    it("shows Date saved by default", () => {
      renderFilterBar();
      expect(screen.getByText("Date saved")).toBeInTheDocument();
    });

    it("opens dropdown and shows all sort options", () => {
      renderFilterBar();
      // The trigger contains "Date saved" text
      const sortButton = screen.getByText("Date saved").closest("button")!;
      fireEvent.click(sortButton);
      const listbox = screen.getByRole("listbox", { name: /sort by/i });
      expect(within(listbox).getByText("Date saved")).toBeInTheDocument();
      expect(within(listbox).getByText("Title")).toBeInTheDocument();
      expect(within(listbox).getByText("Source")).toBeInTheDocument();
    });

    it("changes sort on selection", () => {
      renderFilterBar();
      const sortButton = screen.getByText("Date saved").closest("button")!;
      fireEvent.click(sortButton);
      fireEvent.click(screen.getByRole("option", { name: /title/i }));
      // Trigger should now show Title
      expect(screen.getByText("Title")).toBeInTheDocument();
    });

    it("reads sort from URL params", () => {
      renderFilterBar("/?sort=title");
      expect(screen.getByText("Title")).toBeInTheDocument();
    });
  });

  // ─── ActiveFilters ─────────────────────────────────────

  describe("ActiveFilters", () => {
    it("is hidden when no active filters", () => {
      renderFilterBar();
      expect(screen.queryByText("FILTERED BY")).not.toBeInTheDocument();
      expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
    });

    it("shows source chip when source filter is active", () => {
      renderFilterBar("/?source=github");
      expect(screen.getByText("FILTERED BY")).toBeInTheDocument();
      expect(screen.getByLabelText("Remove GitHub filter")).toBeInTheDocument();
      expect(screen.getByText("Clear all")).toBeInTheDocument();
    });

    it("shows tag chips when tag filters are active", () => {
      renderFilterBar("/?tags=react,ml");
      expect(screen.getByText("FILTERED BY")).toBeInTheDocument();
      expect(screen.getAllByLabelText("Remove tag react").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByLabelText("Remove tag ml").length).toBeGreaterThanOrEqual(1);
    });

    it("removes source filter via chip", () => {
      renderFilterBar("/?source=github");
      fireEvent.click(screen.getByLabelText("Remove GitHub filter"));
      // Active filters should hide
      expect(screen.queryByText("FILTERED BY")).not.toBeInTheDocument();
    });

    it("clears all filters on Clear all click", () => {
      renderFilterBar("/?source=github&tags=react&sort=title");
      fireEvent.click(screen.getByText("Clear all"));
      // Back to defaults
      expect(screen.queryByText("FILTERED BY")).not.toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /all/i })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Date saved")).toBeInTheDocument();
    });
  });
});
