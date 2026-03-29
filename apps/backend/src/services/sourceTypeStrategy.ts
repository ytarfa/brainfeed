export interface SourceTypeStrategy {
  /**
   * Returns the source type string for the given hostname,
   * or `null` if this strategy does not handle the hostname.
   */
  detect(hostname: string): string | null;
}

const SOURCE_TYPE_MAP: Record<string, string> = {
  "github.com": "github",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "instagram.com": "instagram",
  "reddit.com": "reddit",
  "amazon.com": "amazon",
  "arxiv.org": "academic",
  "scholar.google.com": "academic",
};

/**
 * Generic hostname-lookup strategy.
 * Matches against a static map and falls back to "generic".
 */
export class GenericSourceTypeStrategy implements SourceTypeStrategy {
  detect(hostname: string): string | null {
    return SOURCE_TYPE_MAP[hostname] ?? null;
  }
}
