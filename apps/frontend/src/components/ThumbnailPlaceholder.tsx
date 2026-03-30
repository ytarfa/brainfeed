import React from "react";
import {
  Code2,
  Play,
  FileText,
  Diamond,
} from "lucide-react";

/** Unified placeholder colors — muted neutral tones that harmonize with the design system. */
const placeholderColors = { from: "#4a4440", to: "#6a5f58", accent: "rgba(255,255,255,0.14)" };

const sourceIcons: Record<string, React.ReactNode> = {
  github:  <Code2 strokeWidth={1.5} />,
  youtube: <Play strokeWidth={1.5} />,
  article: <FileText strokeWidth={1.5} />,
  generic: <Diamond strokeWidth={1.5} />,
};

interface ThumbnailPlaceholderProps {
  sourceType: string | null;
  /** Pixel height — defaults to 140 for cards */
  height?: number;
  /** Additional class names */
  className?: string;
  /** When true, renders a subtle noise texture overlay */
  showNoise?: boolean;
  /** CSS variable for the bottom fade gradient target (default: --bg-raised for cards) */
  fadeTarget?: string;
  /** Size of the centered icon in pixels (default: 36) */
  iconSize?: number;
}

/**
 * Abstract gradient placeholder that fills the thumbnail area
 * when a bookmark has no image. Each source type gets a unique
 * color palette so the grid stays visually interesting.
 */
export default function ThumbnailPlaceholder({
  sourceType,
  height = 140,
  className = "",
  showNoise = true,
  fadeTarget = "var(--bg-raised)",
  iconSize = 36,
}: ThumbnailPlaceholderProps) {
  const key = sourceType ?? "generic";
  const colors = placeholderColors;
  const icon = sourceIcons[key] ?? sourceIcons.generic;

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Primary gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 60%, ${colors.from} 100%)`,
        }}
      />

      {/* Subtle radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 70% 40%, ${colors.to}88 0%, transparent 70%)`,
        }}
      />

      {/* Noise texture overlay via inline SVG filter */}
      {showNoise && (
        <svg className="absolute inset-0 h-full w-full opacity-[0.35]" xmlns="http://www.w3.org/2000/svg">
          <filter id={`noise-${key}`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#noise-${key})`} />
        </svg>
      )}

      {/* Subtle geometric mesh lines */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 400 140"
      >
        <line x1="0" y1="0" x2="400" y2="140" stroke="white" strokeWidth="0.5" />
        <line x1="100" y1="0" x2="400" y2="105" stroke="white" strokeWidth="0.5" />
        <line x1="200" y1="0" x2="400" y2="70" stroke="white" strokeWidth="0.5" />
        <line x1="0" y1="70" x2="400" y2="35" stroke="white" strokeWidth="0.5" />
        <line x1="0" y1="140" x2="300" y2="0" stroke="white" strokeWidth="0.5" />
        <circle cx="200" cy="70" r="60" fill="none" stroke="white" strokeWidth="0.3" />
        <circle cx="200" cy="70" r="100" fill="none" stroke="white" strokeWidth="0.2" />
      </svg>

      {/* Centered source-type icon */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: colors.accent }}
      >
        <div style={{ width: iconSize, height: iconSize }}>
          {React.cloneElement(icon as React.ReactElement, { size: iconSize })}
        </div>
      </div>

      {/* Bottom gradient fade to card background */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10"
        style={{
          background: `linear-gradient(to top, ${fadeTarget} 0%, transparent 100%)`,
        }}
      />
    </div>
  );
}
