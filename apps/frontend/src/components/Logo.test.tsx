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
    { size: "sm" as const, expectedMark: "18px", expectedWord: "14px" },
    { size: "md" as const, expectedMark: "22px", expectedWord: "17px" },
    { size: "lg" as const, expectedMark: "28px", expectedWord: "22px" },
  ])("applies correct font sizes for size=$size", ({ size, expectedMark, expectedWord }) => {
    render(<Logo size={size} />);
    expect(screen.getByText("b.")).toHaveStyle({ fontSize: expectedMark });
    expect(screen.getByText("brainfeed")).toHaveStyle({ fontSize: expectedWord });
  });

  it("mark color is always #d4845a", () => {
    const { rerender } = render(<Logo />);
    expect(screen.getByText("b.")).toHaveStyle({ color: "#d4845a" });

    rerender(<Logo dark />);
    expect(screen.getByText("b.")).toHaveStyle({ color: "#d4845a" });
  });

  it("word color is #1e1c1a when dark=false (default)", () => {
    render(<Logo />);
    expect(screen.getByText("brainfeed")).toHaveStyle({ color: "#1e1c1a" });
  });

  it("word color is #faf8f4 when dark=true", () => {
    render(<Logo dark />);
    expect(screen.getByText("brainfeed")).toHaveStyle({ color: "#faf8f4" });
  });
});
