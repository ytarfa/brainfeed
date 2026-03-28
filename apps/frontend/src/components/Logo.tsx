import React from "react";

interface LogoProps {
  variant?: "full" | "wordmark" | "mark";
  size?: "sm" | "md" | "lg";
  dark?: boolean;
}

export default function Logo({ variant = "full", size = "md", dark = false }: LogoProps) {
  const sizes = {
    sm: { mark: 18, word: 14 },
    md: { mark: 22, word: 17 },
    lg: { mark: 28, word: 22 },
  };

  const s = sizes[size];
  const markColor = "#d4845a";
  const wordColor = dark ? "#faf8f4" : "#1e1c1a";

  const markStyle: React.CSSProperties = {
    fontFamily: '"Lora", Georgia, serif',
    fontWeight: 500,
    fontSize: s.mark,
    color: markColor,
    lineHeight: 1,
    letterSpacing: "-0.01em",
  };

  const wordStyle: React.CSSProperties = {
    fontFamily: '"Lora", Georgia, serif',
    fontWeight: 500,
    fontSize: s.word,
    color: wordColor,
    lineHeight: 1,
    letterSpacing: "-0.02em",
  };

  if (variant === "mark") {
    return <span style={markStyle}>b.</span>;
  }

  if (variant === "wordmark") {
    return <span style={wordStyle}>brainfeed</span>;
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 1 }}>
      <span style={markStyle}>b.</span>
      <span style={wordStyle}>brainfeed</span>
    </span>
  );
}
