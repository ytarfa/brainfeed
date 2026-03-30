import type { SourceType } from "@brain-feed/types";

export interface SourceTypeStrategy {
  /**
   * Returns the source type for the given hostname,
   * or `null` if this strategy does not handle the hostname.
   */
  detect(hostname: string): SourceType | null;
}

const SOURCE_TYPE_MAP: Record<string, SourceType> = {
  "github.com": "github",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
};

/**
 * Hostname-lookup strategy.
 * Matches against a static map; returns null for unknown hosts.
 */
export class GenericSourceTypeStrategy implements SourceTypeStrategy {
  detect(hostname: string): SourceType | null {
    return SOURCE_TYPE_MAP[hostname] ?? null;
  }
}
