import React from "react";

import { cn } from "../lib/utils";

interface LogoProps {
  variant?: "full" | "wordmark" | "mark";
  size?: "sm" | "md" | "lg";
  dark?: boolean;
}

const sizeMap = {
  sm: { mark: "text-[18px]", word: "text-[14px]" },
  md: { mark: "text-[22px]", word: "text-[17px]" },
  lg: { mark: "text-[28px]", word: "text-[22px]" },
} as const;

export default function Logo({ variant = "full", size = "md", dark = false }: LogoProps) {
  const s = sizeMap[size];

  const markClass = cn(
    "font-display font-medium leading-none tracking-tight text-terra-DEFAULT",
    s.mark,
  );

  const wordClass = cn(
    "font-display font-medium leading-none",
    s.word,
    dark ? "text-sand-parchment" : "text-ink-DEFAULT",
  );

  if (variant === "mark") {
    return <span className={markClass}>b.</span>;
  }

  if (variant === "wordmark") {
    return <span className={wordClass}>brainfeed</span>;
  }

  return (
    <span className="inline-flex items-baseline gap-px">
      <span className={markClass}>b.</span>
      <span className={wordClass}>brainfeed</span>
    </span>
  );
}
