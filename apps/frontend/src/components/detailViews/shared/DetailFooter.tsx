import React from "react";
import { ExternalLink, ArrowUpRight } from "lucide-react";

interface DetailFooterProps {
  url: string;
  /** Override the default "Open original source" label. */
  label?: string;
}

/**
 * Footer bar with "Open original source" link.
 *
 * Rendered as a sticky bottom bar with top border.
 * Views can override the label (e.g. "Open on Instagram").
 */
export default function DetailFooter({ url, label = "Open original source" }: DetailFooterProps) {
  return (
    <div className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 px-7 py-3.5">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 font-ui text-[13px] font-medium text-[var(--accent)] transition-colors duration-150 hover:text-[var(--accent-text)]"
      >
        <ExternalLink size={13} strokeWidth={2} />
        {label}
        <ArrowUpRight size={11} className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
      </a>
    </div>
  );
}
