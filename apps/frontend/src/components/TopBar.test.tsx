import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TopBar from "./TopBar";

const defaultProps = {
  onAddClick: vi.fn(),
  onSearchClick: vi.fn(),
  view: "grid" as const,
  onViewChange: vi.fn(),
  onToggleDark: vi.fn(),
  dark: false,
  onToggleSidebar: vi.fn(),
};

describe("TopBar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders search bar with 'Search everything…' text", () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText("Search everything…")).toBeInTheDocument();
  });

  it("renders keyboard shortcut hint '⌘K'", () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("calls onSearchClick when search bar clicked", () => {
    const onSearchClick = vi.fn();
    render(<TopBar {...defaultProps} onSearchClick={onSearchClick} />);
    fireEvent.click(screen.getByText("Search everything…"));
    expect(onSearchClick).toHaveBeenCalledTimes(1);
  });

  it("renders Save button with '+' and 'Save' text", () => {
    render(<TopBar {...defaultProps} />);
    const saveBtn = screen.getByText("Save");
    expect(saveBtn).toBeInTheDocument();
    // The + is a sibling span inside the same button
    expect(saveBtn.closest("button")!.textContent).toContain("+");
  });

  it("calls onAddClick when Save button clicked", () => {
    const onAddClick = vi.fn();
    render(<TopBar {...defaultProps} onAddClick={onAddClick} />);
    fireEvent.click(screen.getByText("Save"));
    expect(onAddClick).toHaveBeenCalledTimes(1);
  });

  it("renders view toggle buttons (grid and list)", () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByTitle("Grid view")).toBeInTheDocument();
    expect(screen.getByTitle("List view")).toBeInTheDocument();
  });

  it("calls onViewChange with 'grid' when grid button clicked", () => {
    const onViewChange = vi.fn();
    render(<TopBar {...defaultProps} onViewChange={onViewChange} />);
    fireEvent.click(screen.getByTitle("Grid view"));
    expect(onViewChange).toHaveBeenCalledWith("grid");
  });

  it("calls onViewChange with 'list' when list button clicked", () => {
    const onViewChange = vi.fn();
    render(<TopBar {...defaultProps} onViewChange={onViewChange} />);
    fireEvent.click(screen.getByTitle("List view"));
    expect(onViewChange).toHaveBeenCalledWith("list");
  });

  it("renders dark mode toggle", () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByTitle("Dark mode")).toBeInTheDocument();
  });

  it("dark mode toggle shows 'Dark mode' title when dark=false", () => {
    render(<TopBar {...defaultProps} dark={false} />);
    expect(screen.getByTitle("Dark mode")).toBeInTheDocument();
    expect(screen.queryByTitle("Light mode")).not.toBeInTheDocument();
  });

  it("dark mode toggle shows 'Light mode' title when dark=true", () => {
    render(<TopBar {...defaultProps} dark={true} />);
    expect(screen.getByTitle("Light mode")).toBeInTheDocument();
    expect(screen.queryByTitle("Dark mode")).not.toBeInTheDocument();
  });

  it("calls onToggleDark when dark mode toggle clicked", () => {
    const onToggleDark = vi.fn();
    render(<TopBar {...defaultProps} onToggleDark={onToggleDark} />);
    fireEvent.click(screen.getByTitle("Dark mode"));
    expect(onToggleDark).toHaveBeenCalledTimes(1);
  });
});
