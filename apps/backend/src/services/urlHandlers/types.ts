import type { SourceType } from "@brain-feed/types";

import type { OgMetadata } from "../ogFetcher";

/**
 * Unified output of the URL handler registry.
 * Consumed directly by the route handler for bookmark creation.
 */
export interface ResolvedBookmark {
  sourceType: SourceType;
  thumbnailUrl: string | null;
  title: string | null;
  description: string | null;
  author: string | null;
}

/**
 * Per-URL-type handler that owns detection, metadata resolution,
 * and source type declaration.
 *
 * Handlers are stateless and side-effect-free.
 * `resolve()` is only called when `matches()` returns true.
 */
export interface UrlHandler {
  readonly sourceType: SourceType;

  /** Determine whether this handler applies to the given URL and OG metadata. */
  matches(url: URL, og: OgMetadata): boolean;

  /** Return handler-specific field overrides to merge over the OG base layer. */
  resolve(url: URL, og: OgMetadata): Promise<Partial<ResolvedBookmark>>;
}

/**
 * Sentinel OgMetadata used when the OG fetch returns null.
 * Ensures handlers always receive a valid OgMetadata object.
 */
export const NULL_OG_METADATA: OgMetadata = {
  type: null,
  title: null,
  description: null,
  image: null,
  author: null,
  siteName: null,
  publishedAt: null,
  url: null,
};
