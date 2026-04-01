import React from "react";

import type { Bookmark } from "@brain-feed/types";

import type { DetailViewProps, DetailViewKey } from "./types";

/**
 * Registry mapping composite keys to detail view components.
 *
 * Populated lazily — each view registers itself on import.
 * Use `registerDetailView()` to add entries and `resolveDetailView()` to look up.
 */
const registry = new Map<string, React.ComponentType<DetailViewProps>>();

/** Register a detail view component for a given key. */
export function registerDetailView(
  key: DetailViewKey,
  component: React.ComponentType<DetailViewProps>,
): void {
  registry.set(key, component);
}

/**
 * Derive the composite registry key from a bookmark.
 *
 * - `content_type !== "link"` → key is `content_type` (e.g. `"note"`)
 * - `content_type === "link"` → key is `link:<source_type ?? "generic">`
 */
export function getDetailViewKey(bookmark: Bookmark): string {
  if (bookmark.content_type !== "link") {
    return bookmark.content_type;
  }
  return `link:${bookmark.source_type ?? "generic"}`;
}

/** Default (fallback) view — lazily resolved on first call. */
let DefaultView: React.ComponentType<DetailViewProps> | null = null;

/** Set the default/fallback view component. */
export function setDefaultDetailView(
  component: React.ComponentType<DetailViewProps>,
): void {
  DefaultView = component;
}

/**
 * Resolve the detail view component for a bookmark.
 *
 * Returns the registered component for the bookmark's composite key,
 * or the default view if no match is found.
 */
export function resolveDetailView(
  bookmark: Bookmark,
): React.ComponentType<DetailViewProps> {
  const key = getDetailViewKey(bookmark);
  const View = registry.get(key);
  if (View) return View;

  // Fallback to default
  if (DefaultView) return DefaultView;

  // Absolute fallback — should never happen if setup is correct
  throw new Error(
    `[detailViews/registry] No view registered for key "${key}" and no default view set.`,
  );
}
