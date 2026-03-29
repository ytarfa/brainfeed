import React from "react";
import {
  Code2,
  Play,
  AtSign,
  Newspaper,
  ShoppingCart,
  GraduationCap,
  Diamond,
  PenLine,
  ImageIcon,
  FileText,
  File,
  MessageCircle,
  Music,
  Rss,
} from "lucide-react";

/**
 * Source-type color palettes — each has a primary gradient pair
 * and an accent for the icon. Colors are intentionally muted
 * to harmonize with the warm sand/terra design system.
 */
const sourceColorMap: Record<string, { from: string; to: string; accent: string }> = {
  github:  { from: "#2d2a3e", to: "#4a3f6b", accent: "rgba(255,255,255,0.18)" },
  youtube: { from: "#6b2a2a", to: "#8b3a3a", accent: "rgba(255,255,255,0.16)" },
  twitter: { from: "#2a4a6b", to: "#3a5f8b", accent: "rgba(255,255,255,0.16)" },
  news:    { from: "#4a3a2a", to: "#6b5a3a", accent: "rgba(255,255,255,0.15)" },
  amazon:  { from: "#3a4a2a", to: "#5a6b3a", accent: "rgba(255,255,255,0.15)" },
  paper:   { from: "#3a2a4a", to: "#5a3a6b", accent: "rgba(255,255,255,0.16)" },
  generic: { from: "#4a4440", to: "#6a5f58", accent: "rgba(255,255,255,0.14)" },
  note:    { from: "#4a4036", to: "#6b5a48", accent: "rgba(255,255,255,0.15)" },
  image:   { from: "#2a4a4a", to: "#3a6b6b", accent: "rgba(255,255,255,0.16)" },
  pdf:     { from: "#5a2a2a", to: "#7b3a3a", accent: "rgba(255,255,255,0.16)" },
  file:    { from: "#3a3a4a", to: "#5a5a6b", accent: "rgba(255,255,255,0.14)" },
  reddit:  { from: "#5a3a2a", to: "#7b4a3a", accent: "rgba(255,255,255,0.16)" },
  spotify: { from: "#2a4a36", to: "#3a6b4a", accent: "rgba(255,255,255,0.16)" },
  rss:     { from: "#5a4a2a", to: "#7b6a3a", accent: "rgba(255,255,255,0.15)" },
};

const sourceIcons: Record<string, React.ReactNode> = {
  github:  <Code2 strokeWidth={1.5} />,
  youtube: <Play strokeWidth={1.5} />,
  twitter: <AtSign strokeWidth={1.5} />,
  news:    <Newspaper strokeWidth={1.5} />,
  amazon:  <ShoppingCart strokeWidth={1.5} />,
  paper:   <GraduationCap strokeWidth={1.5} />,
  generic: <Diamond strokeWidth={1.5} />,
  note:    <PenLine strokeWidth={1.5} />,
  image:   <ImageIcon strokeWidth={1.5} />,
  pdf:     <FileText strokeWidth={1.5} />,
  file:    <File strokeWidth={1.5} />,
  reddit:  <MessageCircle strokeWidth={1.5} />,
  spotify: <Music strokeWidth={1.5} />,
  rss:     <Rss strokeWidth={1.5} />,
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
  const colors = sourceColorMap[key] ?? sourceColorMap.generic;
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
