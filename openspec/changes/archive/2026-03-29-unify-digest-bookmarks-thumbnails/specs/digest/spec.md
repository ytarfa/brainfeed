## MODIFIED Requirements

### Requirement: Digest candidates table
The system SHALL store digest candidates as rows in the `bookmarks` table with `digest_status = 'active'`. Digest candidates SHALL use the existing bookmarks columns (`id`, `user_id`, `url`, `title`, `description`, `thumbnail_url`, `source_type`, `enrichment_status`, `enriched_data`, `tags`, `created_at`, `updated_at`) plus the following additional columns on bookmarks: `digest_status` (text, nullable, one of 'active', 'saved', 'dismissed'), `source_name` (text, nullable), `source_id` (uuid, nullable FK to sync_sources), `published_at` (timestamptz, nullable), `expires_at` (timestamptz, nullable). Regular bookmarks SHALL have `digest_status = NULL`. Row-level security on bookmarks SHALL continue to restrict access to rows owned by the authenticated user. An index on `(user_id, digest_status)` and `(expires_at)` SHALL be created for query performance.

#### Scenario: Digest candidate created by sync worker
- **WHEN** a sync worker inserts a digest candidate
- **THEN** it is stored as a bookmark row with `digest_status: 'active'`, `content_type: 'link'`, `enrichment_status: 'pending'`, and an `expires_at` timestamp

#### Scenario: RLS enforcement
- **WHEN** a user queries bookmarks (including digest candidates)
- **THEN** only rows where `user_id` matches the authenticated user are returned

#### Scenario: Regular bookmarks unaffected
- **WHEN** a regular bookmark is created via the standard bookmark creation endpoint
- **THEN** `digest_status` is NULL and the digest-specific columns (`source_name`, `source_id`, `published_at`, `expires_at`) are NULL

### Requirement: List digest candidates
The system SHALL provide `GET /api/v1/digest` which returns all bookmarks with `digest_status = 'active'` and `expires_at` in the future for the authenticated user, grouped by source. The grouping key SHALL be `source_name` when present, falling back to `source_type`. Results within each group SHALL be ordered by `published_at` descending.

#### Scenario: Retrieve grouped candidates
- **WHEN** a user requests `GET /api/v1/digest`
- **THEN** the response contains bookmarks with `digest_status = 'active'` grouped by source with group metadata (source_name, source_type, count) and candidate items within each group

#### Scenario: Expired candidates excluded
- **WHEN** a user requests `GET /api/v1/digest` and some digest bookmarks have `expires_at` in the past
- **THEN** expired candidates are NOT included in the response

#### Scenario: No active candidates
- **WHEN** a user requests `GET /api/v1/digest` and has no bookmarks with `digest_status = 'active'` and future `expires_at`
- **THEN** the response contains an empty groups array

### Requirement: Digest summary
The system SHALL provide `GET /api/v1/digest/summary` which returns the total count of bookmarks with `digest_status = 'active'` and future `expires_at`, and a per-source breakdown (source_name, source_type, count) for the authenticated user.

#### Scenario: Summary with candidates
- **WHEN** a user requests `GET /api/v1/digest/summary` and has 15 active digest bookmarks across 3 sources
- **THEN** the response contains `total: 15` and a `groups` array with 3 entries, each showing source_name, source_type, and count

#### Scenario: Summary with no candidates
- **WHEN** a user requests `GET /api/v1/digest/summary` and has no active digest bookmarks
- **THEN** the response contains `total: 0` and an empty `groups` array

### Requirement: Save digest candidate
The system SHALL provide `POST /api/v1/digest/:id/save` which promotes a digest bookmark by updating `digest_status` from `'active'` to `'saved'`. No data copying or new row creation SHALL occur. The response SHALL return the updated bookmark.

#### Scenario: Successful save
- **WHEN** a user saves an active digest bookmark via `POST /api/v1/digest/:id/save`
- **THEN** the bookmark's `digest_status` is updated to `'saved'` and the bookmark is returned

#### Scenario: Save already-dismissed candidate
- **WHEN** a user attempts to save a bookmark with `digest_status: 'dismissed'`
- **THEN** the request fails with a 404 Not Found error

#### Scenario: Save non-existent candidate
- **WHEN** a user attempts to save a bookmark that does not exist, belongs to another user, or does not have `digest_status: 'active'`
- **THEN** the request fails with a 404 Not Found error

### Requirement: Dismiss digest candidate
The system SHALL provide `POST /api/v1/digest/:id/dismiss` which marks a single digest bookmark as dismissed by setting its `digest_status` to `'dismissed'`.

#### Scenario: Successful dismiss
- **WHEN** a user dismisses an active digest bookmark via `POST /api/v1/digest/:id/dismiss`
- **THEN** the bookmark's `digest_status` becomes `'dismissed'` and it no longer appears in `GET /api/v1/digest`

#### Scenario: Dismiss non-existent candidate
- **WHEN** a user attempts to dismiss a bookmark that does not exist, belongs to another user, or does not have `digest_status: 'active'`
- **THEN** the request fails with a 404 Not Found error

### Requirement: Bulk dismiss all candidates
The system SHALL provide `POST /api/v1/digest/dismiss-all` which sets `digest_status = 'dismissed'` on all bookmarks with `digest_status = 'active'` and future `expires_at` for the authenticated user.

#### Scenario: Bulk dismiss
- **WHEN** a user requests `POST /api/v1/digest/dismiss-all`
- **THEN** all their active, non-expired digest bookmarks are set to `digest_status: 'dismissed'` and the response includes the count of dismissed items

### Requirement: Bulk dismiss by source group
The system SHALL provide `POST /api/v1/digest/dismiss-group` which accepts a `source_name` (required) and optional `source_type`, and sets `digest_status = 'dismissed'` on all matching active digest bookmarks for the authenticated user.

#### Scenario: Dismiss by source_name
- **WHEN** a user requests `POST /api/v1/digest/dismiss-group` with `source_name: "Fireship"`
- **THEN** all active digest bookmarks with `source_name = 'Fireship'` are set to `digest_status: 'dismissed'`

#### Scenario: Dismiss by source_name and source_type
- **WHEN** a user requests `POST /api/v1/digest/dismiss-group` with `source_name: "r/programming"` and `source_type: "reddit"`
- **THEN** all active digest bookmarks matching both `source_name` and `source_type` are set to `digest_status: 'dismissed'`

### Requirement: Purge expired candidates
The system SHALL provide `DELETE /api/v1/digest/expired` which permanently deletes all bookmarks where `digest_status IS NOT NULL` AND (`expires_at` is in the past OR `digest_status = 'dismissed'`).

#### Scenario: Purge with expired and dismissed items
- **WHEN** `DELETE /api/v1/digest/expired` is called
- **THEN** all digest bookmarks past their `expires_at` and all dismissed digest bookmarks are permanently deleted, and the response includes the count of purged rows

#### Scenario: Regular bookmarks unaffected
- **WHEN** `DELETE /api/v1/digest/expired` is called
- **THEN** bookmarks with `digest_status = NULL` are never deleted regardless of other conditions

### Requirement: Library excludes digest candidates
The system SHALL exclude bookmarks with `digest_status IN ('active', 'dismissed')` from the library listing (`GET /api/v1/bookmarks`) and search (`GET /api/v1/search`) endpoints. Bookmarks with `digest_status = NULL` or `digest_status = 'saved'` SHALL appear in library results.

#### Scenario: Active digest bookmarks excluded from library
- **WHEN** a user lists bookmarks via `GET /api/v1/bookmarks`
- **THEN** bookmarks with `digest_status = 'active'` do not appear in the results

#### Scenario: Saved digest bookmarks included in library
- **WHEN** a user lists bookmarks via `GET /api/v1/bookmarks` and has bookmarks promoted from digest (`digest_status = 'saved'`)
- **THEN** those bookmarks appear in the library results alongside regular bookmarks

#### Scenario: Search excludes digest candidates
- **WHEN** a user searches via `GET /api/v1/search`
- **THEN** bookmarks with `digest_status IN ('active', 'dismissed')` are excluded from search results

### Requirement: Digest page
The frontend SHALL provide a `/digest` route that displays a grouped feed of active digest bookmarks. Each group SHALL show a source header (source name, source type icon, candidate count) and a "Skip All" button for bulk dismiss. Each candidate card SHALL display the title, description or excerpt, thumbnail (if available), source type, and published date. Each card SHALL have a "Save" action and a "Skip" action.

#### Scenario: Viewing the digest page
- **WHEN** a user navigates to `/digest` with active digest bookmarks
- **THEN** bookmarks with `digest_status = 'active'` are displayed grouped by source, each group has a header and "Skip All" button, each card shows preview data with Save and Skip actions

#### Scenario: Empty digest
- **WHEN** a user navigates to `/digest` with no active digest bookmarks
- **THEN** the page displays a "You're all caught up" empty state message

#### Scenario: Saving from the digest page
- **WHEN** a user clicks "Save" on a digest bookmark card
- **THEN** the bookmark's `digest_status` is updated to `'saved'` and the card is removed from the feed

#### Scenario: Dismissing from the digest page
- **WHEN** a user clicks "Skip" on a digest bookmark card
- **THEN** the bookmark's `digest_status` is updated to `'dismissed'` and the card is removed from the feed

#### Scenario: Skip All for a source group
- **WHEN** a user clicks "Skip All" on a source group header
- **THEN** all digest bookmarks in that group are dismissed and the group is removed from the feed

### Requirement: Library digest banner
The Library page SHALL display a banner at the top when there are active digest bookmarks. The banner SHALL show the total candidate count and a brief per-source summary. The banner SHALL link to the `/digest` page. The banner SHALL be dismissible per-session (dismiss hides the banner UI but does not affect bookmarks).

#### Scenario: Banner displayed
- **WHEN** a user visits the Library page and has active digest bookmarks
- **THEN** a banner appears above the library header showing count, source summary, and a link to the Digest page

#### Scenario: Banner dismissed
- **WHEN** a user dismisses the library digest banner
- **THEN** the banner is hidden for the remainder of the session but reappears on next page load

#### Scenario: No candidates
- **WHEN** a user visits the Library page with no active digest bookmarks
- **THEN** no digest banner is displayed

### Requirement: Sidebar digest navigation
The sidebar SHALL include a "Digest" navigation item positioned between the Library link and the Spaces section. The nav item SHALL display a badge with the count of active digest bookmarks (using a 16x16 circular pill, `var(--accent)` background, white text). The badge SHALL only appear when the count is greater than zero.

#### Scenario: Sidebar with candidates
- **WHEN** the sidebar renders and the user has 5 active digest bookmarks
- **THEN** a "Digest" nav item appears between Library and Spaces with a badge showing "5"

#### Scenario: Sidebar with no candidates
- **WHEN** the sidebar renders and the user has no active digest bookmarks
- **THEN** the "Digest" nav item appears without a badge

#### Scenario: Active route highlighting
- **WHEN** the user is on the `/digest` page
- **THEN** the Digest sidebar item is highlighted with the same active style as other nav items

### Requirement: Digest candidate type definition
The shared types package SHALL export a `DigestCandidate` type that is a narrowed view of the `Bookmark` type, requiring `digest_status` to be `'active'`. The type SHALL include all bookmark fields plus the digest-specific fields (`source_name`, `source_id`, `published_at`, `expires_at`, `digest_status`).

#### Scenario: Type available
- **WHEN** a developer imports from `@brain-feed/types`
- **THEN** the `DigestCandidate` type is available as a narrowed Bookmark with `digest_status: 'active'`

### Requirement: Mock digest data
The frontend mock data file SHALL export a `mockDigestCandidates` array with at least 8 bookmark objects with `digest_status: 'active'` spanning at least 3 different source types, enabling the Digest UI to be developed and tested before sync workers exist.

#### Scenario: Mock data available
- **WHEN** a developer imports `mockDigestCandidates` from the mock data module
- **THEN** at least 8 realistic bookmark objects with `digest_status: 'active'` are available across multiple source types with varied titles, descriptions, thumbnails, and published dates

## REMOVED Requirements

### Requirement: Digest candidates table
**Reason**: Digest candidates are now stored as rows in the `bookmarks` table with `digest_status` instead of in a separate `digest_candidates` table.
**Migration**: All existing `digest_candidates` rows are migrated to `bookmarks` rows with `digest_status = 'active'` (or their existing status). The `digest_candidates` table is dropped.
