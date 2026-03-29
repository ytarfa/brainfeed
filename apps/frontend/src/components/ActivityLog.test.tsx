import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ActivityLog from "./ActivityLog";
import type { ActivityEntry } from "@brain-feed/types";

function createMockEntry(overrides: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    id: "act-1",
    space_id: "space-1",
    bookmark_id: "bk-1",
    action: "categorized to Space A",
    details: null,
    user_id: "user-1",
    created_at: "2024-01-01T00:00:00Z",
    bookmarkTitle: "Test Article",
    timestamp: "2 hours ago",
    accepted: undefined,
    ...overrides,
  } as ActivityEntry;
}

const defaultProps = {
  entries: [
    createMockEntry(),
    createMockEntry({ id: "act-2", bookmarkTitle: "Second Article", accepted: true }),
  ],
  onAccept: vi.fn(),
  onUndo: vi.fn(),
};

describe("ActivityLog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("is collapsed by default (only trigger bar visible, no entry list)", () => {
    render(<ActivityLog {...defaultProps} />);
    expect(screen.getByText("AI Activity Log")).toBeInTheDocument();
    // Entry titles should NOT be visible when collapsed
    expect(screen.queryByText("Test Article")).not.toBeInTheDocument();
  });

  it("shows 'AI Activity Log' text", () => {
    render(<ActivityLog {...defaultProps} />);
    expect(screen.getByText("AI Activity Log")).toBeInTheDocument();
  });

  it("shows pending count badge when there are pending entries", () => {
    render(<ActivityLog {...defaultProps} />);
    // One pending entry (accepted === undefined), one accepted
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("does NOT show badge when all entries are accepted", () => {
    const allAccepted = [
      createMockEntry({ id: "act-1", accepted: true }),
      createMockEntry({ id: "act-2", accepted: true }),
    ];
    render(<ActivityLog entries={allAccepted} onAccept={vi.fn()} onUndo={vi.fn()} />);
    // No pending count badge — there should be no number rendered
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    // Confirm the badge element with count is not present
    const buttons = screen.getAllByRole("button");
    const triggerText = buttons[0].textContent || "";
    expect(triggerText).not.toMatch(/\d+/);
  });

  it("expands on click to show entry list", () => {
    render(<ActivityLog {...defaultProps} />);
    fireEvent.click(screen.getByText("AI Activity Log"));
    expect(screen.getByText("Test Article")).toBeInTheDocument();
    expect(screen.getByText("Second Article")).toBeInTheDocument();
  });

  it("renders entry bookmark title and action", () => {
    render(<ActivityLog {...defaultProps} />);
    fireEvent.click(screen.getByText("AI Activity Log"));
    expect(screen.getByText("Test Article")).toBeInTheDocument();
    expect(screen.getAllByText("categorized to Space A")).toHaveLength(2);
  });

  it("truncates long bookmark titles (> 36 chars)", () => {
    const longTitle = "This is a very long bookmark title that exceeds limit";
    const entries = [createMockEntry({ bookmarkTitle: longTitle })];
    render(<ActivityLog entries={entries} onAccept={vi.fn()} onUndo={vi.fn()} />);
    fireEvent.click(screen.getByText("AI Activity Log"));

    const truncated = longTitle.slice(0, 36) + "…";
    expect(screen.getByText(truncated)).toBeInTheDocument();
    expect(screen.queryByText(longTitle)).not.toBeInTheDocument();
  });

  it("shows Accept and Undo buttons for pending entries", () => {
    render(<ActivityLog {...defaultProps} />);
    fireEvent.click(screen.getByText("AI Activity Log"));
    expect(screen.getByTitle("Accept")).toBeInTheDocument();
    expect(screen.getByTitle("Undo")).toBeInTheDocument();
  });

  it("shows 'Accepted' label for accepted entries", () => {
    render(<ActivityLog {...defaultProps} />);
    fireEvent.click(screen.getByText("AI Activity Log"));
    expect(screen.getByText("Accepted")).toBeInTheDocument();
  });

  it("calls onAccept with entry id when Accept button clicked", () => {
    const onAccept = vi.fn();
    render(<ActivityLog {...defaultProps} onAccept={onAccept} />);
    fireEvent.click(screen.getByText("AI Activity Log"));
    fireEvent.click(screen.getByTitle("Accept"));
    expect(onAccept).toHaveBeenCalledWith("act-1");
  });

  it("calls onUndo with entry id when Undo button clicked", () => {
    const onUndo = vi.fn();
    render(<ActivityLog {...defaultProps} onUndo={onUndo} />);
    fireEvent.click(screen.getByText("AI Activity Log"));
    fireEvent.click(screen.getByTitle("Undo"));
    expect(onUndo).toHaveBeenCalledWith("act-1");
  });

  it("shows empty state message when no entries", () => {
    render(<ActivityLog entries={[]} onAccept={vi.fn()} onUndo={vi.fn()} />);
    fireEvent.click(screen.getByText("AI Activity Log"));
    expect(screen.getByText("No AI activity yet.")).toBeInTheDocument();
  });
});
