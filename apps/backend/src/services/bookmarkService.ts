import type { SourceTypeStrategy } from "./sourceTypeStrategy";
import { GenericSourceTypeStrategy } from "./sourceTypeStrategy";

export class BookmarkService {
  private strategies: SourceTypeStrategy[];

  constructor(strategies?: SourceTypeStrategy[]) {
    this.strategies = strategies ?? [new GenericSourceTypeStrategy()];
  }

  /**
   * Walk the strategy chain and return the first non-null result.
   * Falls back to "generic" if no strategy matches, or "manual" if no URL is provided.
   */
  detectSourceType(url?: string): string {
    if (!url) return "manual";
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      for (const strategy of this.strategies) {
        const result = strategy.detect(hostname);
        if (result !== null) return result;
      }
      return "generic";
    } catch {
      return "generic";
    }
  }
}

/** Default singleton for convenience */
export const bookmarkService = new BookmarkService();
