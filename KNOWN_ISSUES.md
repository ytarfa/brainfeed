# Known Issues

## 1. Bookmarks with `title: null` render empty headings

Some bookmarks in the database have `title: null` (e.g. the GitHub repo `supreme-gg-gg/instagram-cli`). The `BookmarkCard` renders an empty `<h3>` in this case. Should fall back to the URL, domain, or a placeholder like "Untitled".

## 2. `savedAt` shows raw ISO timestamps

The `toBookmark()` transformer in `apps/frontend/src/api/hooks/useBookmarks.ts` passes `created_at` through as-is. Cards display values like `2026-03-29T15:56:43.499633+00:00` instead of human-readable relative times ("2 hours ago", "Yesterday").

## 3. `toBookmark()` does not map `metadata` from `enriched_data`

The transformer (`useBookmarks.ts:162-189`) never reads the `enriched_data` JSONB column from the API response. The frontend `Bookmark.metadata` field is always `undefined`, which means source-type variant components (GitHubMeta, YouTubeMeta, etc.) never render even when enrichment data exists in the database.

Needs: extract relevant fields from `enriched_data` into `metadata: Record<string, string | number>`.

## 4. `toBookmark()` does not map `summary`

The database stores summaries in the `description` column, but the transformer does not map it to the frontend `Bookmark.summary` field. Cards show no summary text.

## 5. `isArticle` flag is never set

The `toBookmark()` transformer does not compute or map `isArticle`. This flag controls italic title styling for long-form articles and papers.

## 6. All bookmarks have `enriched_data: null`

As of 2026-03-29, every bookmark in the database has `enriched_data: null` and `enrichment_status: "pending"`. The enrichment pipeline has not yet run. Once it does, issue #3 above will also need to be resolved for the data to surface in the UI.
