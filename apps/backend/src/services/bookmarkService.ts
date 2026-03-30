import type { SourceType } from "@brain-feed/types";
import type { SourceTypeStrategy } from "./sourceTypeStrategy";
import { GenericSourceTypeStrategy } from "./sourceTypeStrategy";

export class BookmarkService {
  private strategies: SourceTypeStrategy[];

  constructor(strategies?: SourceTypeStrategy[]) {
    this.strategies = strategies ?? [new GenericSourceTypeStrategy()];
  }

  /**
   * Walk the strategy chain and return the first non-null result.
   * Falls back to "generic" if no strategy matches.
   */
  detectSourceType(url: string): SourceType {
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
