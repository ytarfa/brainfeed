import React from "react";
import { render, screen } from "@testing-library/react";
import Logo from "./Logo";

describe("Logo", () => {
  it("renders 'b.' mark and 'brainfeed' word in full variant (default)", () => {
    render(<Logo />);
    expect(screen.getByText("b.")).toBeInTheDocument();
    expect(screen.getByText("brainfeed")).toBeInTheDocument();
  });

  it("renders only 'b.' in mark variant", () => {
    render(<Logo variant="mark" />);
    expect(screen.getByText("b.")).toBeInTheDocument();
    expect(screen.queryByText("brainfeed")).not.toBeInTheDocument();
  });

  it("renders only 'brainfeed' in wordmark variant", () => {
    render(<Logo variant="wordmark" />);
    expect(screen.getByText("brainfeed")).toBeInTheDocument();
    expect(screen.queryByText("b.")).not.toBeInTheDocument();
  });

  it.each([
    { size: "sm" as const, expectedMark: "text-[18px]", expectedWord: "text-[14px]" },
    { size: "md" as const, expectedMark: "text-[22px]", expectedWord: "text-[17px]" },
    { size: "lg" as const, expectedMark: "text-[28px]", expectedWord: "text-[22px]" },
  ])("applies correct font sizes for size=$size", ({ size, expectedMark, expectedWord }) => {
    render(<Logo size={size} />);
    expect(screen.getByText("b.").className).toContain(expectedMark);
    expect(screen.getByText("brainfeed").className).toContain(expectedWord);
  });

  it("mark color is always text-terra-DEFAULT", () => {
    const { rerender } = render(<Logo />);
    expect(screen.getByText("b.").className).toContain("text-terra-DEFAULT");

    rerender(<Logo dark />);
    expect(screen.getByText("b.").className).toContain("text-terra-DEFAULT");
  });

  it("word color is text-ink-DEFAULT when dark=false (default)", () => {
    render(<Logo />);
    expect(screen.getByText("brainfeed").className).toContain("text-ink-DEFAULT");
  });

  it("word color is text-sand-parchment when dark=true", () => {
    render(<Logo dark />);
    expect(screen.getByText("brainfeed").className).toContain("text-sand-parchment");
  });
});
