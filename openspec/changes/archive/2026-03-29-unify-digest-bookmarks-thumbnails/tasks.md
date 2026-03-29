## 1. Database Migration

- [x] 1.1 Add `digest_status`, `source_name`, `source_id`, `published_at`, `expires_at` columns to `bookmarks` table with appropriate types, constraints, and CHECK on `digest_status`
- [x] 1.2 Add indexes: `(user_id, digest_status)` composite index and `(expires_at)` index on bookmarks
- [x] 1.3 Migrate existing `digest_candidates` rows into `bookmarks` (mapping fields, setting `content_type: 'link'`, `enrichment_status: 'pending'`, `tags: '{}'`)
- [x] 1.4 Drop `digest_candidates` table, its RLS policies, and its indexes

## 2. Types Package Update

- [x] 2.1 Regenerate `database.types.ts` to reflect new bookmarks columns and removed digest_candidates table
- [x] 2.2 Update `app.types.ts`: add `digest_status`, `source_name`, `source_id`, `published_at`, `expires_at` to the `Bookmark` type; add `DigestStatus` union type
- [x] 2.3 Redefine `DigestCandidate` as a narrowed view of `Bookmark` with `digest_status: 'active'`
- [x] 2.4 Remove `digest_candidates`-specific type exports that no longer apply

## 3. Thumbnail Resolution Service

- [x] 3.1 Add `cheerio` dependency to backend `package.json`
- [x] 3.2 Create `apps/backend/src/services/thumbnailService.ts` with `resolveThumbnail(url, sourceType)` function
- [x] 3.3 Implement YouTube thumbnail resolver (extract video ID from youtube.com/watch, youtu.be, youtube.com/embed; construct img.youtube.com URL)
- [x] 3.4 Implement GitHub thumbnail resolver (extract owner/repo from github.com URL; construct opengraph.githubassets.com URL)
- [x] 3.5 Implement generic OG image resolver (fetch URL with 5s timeout, parse HTML with cheerio, extract og:image meta tag content)
- [x] 3.6 Wire `resolveThumbnail` into `POST /api/v1/bookmarks` route for `content_type: "link"` bookmarks, before the INSERT

## 4. Backend Digest Routes Rewrite

- [x] 4.1 Rewrite `GET /api/v1/digest` to query `bookmarks` WHERE `digest_status = 'active'` AND `expires_at > now()`, grouped by `source_name`
- [x] 4.2 Rewrite `GET /api/v1/digest/summary` to query `bookmarks` WHERE `digest_status = 'active'` AND `expires_at > now()`
- [x] 4.3 Rewrite `POST /api/v1/digest/:id/save` to UPDATE `bookmarks` SET `digest_status = 'saved'` WHERE `id` AND `digest_status = 'active'`
- [x] 4.4 Rewrite `POST /api/v1/digest/:id/dismiss` to UPDATE `bookmarks` SET `digest_status = 'dismissed'` WHERE `id` AND `digest_status = 'active'`
- [x] 4.5 Rewrite `POST /api/v1/digest/dismiss-all` to UPDATE `bookmarks` SET `digest_status = 'dismissed'` WHERE `digest_status = 'active'` AND `expires_at > now()`
- [x] 4.6 Rewrite `POST /api/v1/digest/dismiss-group` to UPDATE `bookmarks` with `source_name` and optional `source_type` filter
- [x] 4.7 Rewrite `DELETE /api/v1/digest/expired` to DELETE FROM `bookmarks` WHERE `digest_status IS NOT NULL` AND (`expires_at < now()` OR `digest_status = 'dismissed'`)

## 5. Backend Bookmark Routes Update

- [x] 5.1 Add digest_status filter to `GET /api/v1/bookmarks` (exclude `active` and `dismissed`)
- [x] 5.2 Add digest_status filter to `GET /api/v1/search` (exclude `active` and `dismissed`)
- [x] 5.3 Add digest_status filter to `GET /api/v1/public/spaces/:shareToken` (exclude `active` and `dismissed`, or verify they're already excluded by the space join)

## 6. Frontend Types and Hooks Update

- [x] 6.1 Update `useDigest.ts` hooks to work with Bookmark objects returned from the rewritten digest endpoints
- [x] 6.2 Update mock data: convert `mockDigestCandidates` to bookmark objects with `digest_status: 'active'` and the required bookmark fields (`content_type`, `enrichment_status`, `tags`, etc.)

## 7. Frontend Page Update

- [x] 7.1 Update `DigestPage.tsx` to work with Bookmark objects instead of DigestCandidate objects (adjust field references if needed)

## 8. Verification

- [x] 8.1 Run `pnpm build` and fix any type errors across both apps
- [x] 8.2 Run `pnpm lint` and fix any lint errors
