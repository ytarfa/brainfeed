## ADDED Requirements

### Requirement: Digest candidates table
The system SHALL store digest candidates in a dedicated `digest_candidates` table, separate from the `bookmarks` table. Each candidate SHALL have: `id` (uuid PK), `user_id` (uuid FK to profiles), `source_type` (text), `source_name` (text), `source_id` (uuid nullable FK to sync_sources), `url` (text NOT NULL), `title` (text), `description` (text), `thumbnail_url` (text), `published_at` (timestamptz), `status` (text, one of 'active', 'saved', 'dismissed'), `expires_at` (timestamptz NOT NULL), `created_at` (timestamptz), `updated_at` (timestamptz). Row-level security SHALL restrict access to candidates owned by the authenticated user.

#### Scenario: Candidate created by sync worker
- **WHEN** a sync worker inserts a candidate for a user
- **THEN** the candidate is stored with `status: 'active'` and an `expires_at` timestamp set to 14 days from creation

#### Scenario: RLS enforcement
- **WHEN** a user queries digest_candidates
- **THEN** only rows where `user_id` matches the authenticated user are returned

### Requirement: List digest candidates
The system SHALL provide `GET /api/digest` which returns all active, non-expired candidates for the authenticated user, grouped by source. The grouping key SHALL be `source_id` when present, falling back to `source_type`. Results within each group SHALL be ordered by `published_at` descending.

#### Scenario: Retrieve grouped candidates
- **WHEN** a user requests `GET /api/digest`
- **THEN** the response contains candidates grouped by source with group metadata (source_name, source_type, count) and candidate items within each group

#### Scenario: Expired candidates excluded
- **WHEN** a user requests `GET /api/digest` and some candidates have `expires_at` in the past
- **THEN** expired candidates are NOT included in the response

#### Scenario: No active candidates
- **WHEN** a user requests `GET /api/digest` and has no active, non-expired candidates
- **THEN** the response contains an empty groups array

### Requirement: Digest summary
The system SHALL provide `GET /api/digest/summary` which returns the total count of active non-expired candidates and a per-source breakdown (source_name, source_type, count) for the authenticated user.

#### Scenario: Summary with candidates
- **WHEN** a user requests `GET /api/digest/summary` and has 15 active candidates across 3 sources
- **THEN** the response contains `total: 15` and a `groups` array with 3 entries, each showing source_name, source_type, and count

#### Scenario: Summary with no candidates
- **WHEN** a user requests `GET /api/digest/summary` and has no active candidates
- **THEN** the response contains `total: 0` and an empty `groups` array

### Requirement: Save digest candidate
The system SHALL provide `POST /api/digest/:id/save` which promotes a candidate to a bookmark. Saving SHALL create a new row in the `bookmarks` table with the candidate's `url`, `title`, `description`, `thumbnail_url`, and `source_type`, set `enrichment_status` to `'pending'`, and update the candidate's status to `'saved'`. No `bookmark_spaces` row SHALL be created.

#### Scenario: Successful save
- **WHEN** a user saves an active candidate via `POST /api/digest/:id/save`
- **THEN** a bookmark is created with the candidate's data, `enrichment_status` is `'pending'`, no `bookmark_spaces` row exists, and the candidate status becomes `'saved'`

#### Scenario: Save already-dismissed candidate
- **WHEN** a user attempts to save a candidate with `status: 'dismissed'`
- **THEN** the request fails with a 409 Conflict error

#### Scenario: Save non-existent candidate
- **WHEN** a user attempts to save a candidate that does not exist or belongs to another user
- **THEN** the request fails with a 404 Not Found error

### Requirement: Dismiss digest candidate
The system SHALL provide `POST /api/digest/:id/dismiss` which marks a single candidate as dismissed by setting its status to `'dismissed'`.

#### Scenario: Successful dismiss
- **WHEN** a user dismisses an active candidate via `POST /api/digest/:id/dismiss`
- **THEN** the candidate's status becomes `'dismissed'` and it no longer appears in `GET /api/digest`

#### Scenario: Dismiss non-existent candidate
- **WHEN** a user attempts to dismiss a candidate that does not exist or belongs to another user
- **THEN** the request fails with a 404 Not Found error

### Requirement: Bulk dismiss all candidates
The system SHALL provide `POST /api/digest/dismiss-all` which marks all active, non-expired candidates for the authenticated user as dismissed.

#### Scenario: Bulk dismiss
- **WHEN** a user requests `POST /api/digest/dismiss-all`
- **THEN** all their active, non-expired candidates are set to `status: 'dismissed'` and the response includes the count of dismissed candidates

### Requirement: Bulk dismiss by source group
The system SHALL provide `POST /api/digest/dismiss-group` which accepts a `source_id` or `source_type` identifier and marks all matching active candidates for the authenticated user as dismissed.

#### Scenario: Dismiss by source_id
- **WHEN** a user requests `POST /api/digest/dismiss-group` with a `source_id`
- **THEN** all active candidates with that `source_id` are set to `status: 'dismissed'`

#### Scenario: Dismiss by source_type
- **WHEN** a user requests `POST /api/digest/dismiss-group` with a `source_type` (and no `source_id`)
- **THEN** all active candidates with that `source_type` (and null `source_id`) are set to `status: 'dismissed'`

### Requirement: Purge expired candidates
The system SHALL provide `DELETE /api/digest/expired` which permanently deletes all candidates where `expires_at` is in the past or `status` is `'dismissed'`.

#### Scenario: Purge with expired and dismissed items
- **WHEN** an admin or cron calls `DELETE /api/digest/expired`
- **THEN** all candidates past their `expires_at` and all dismissed candidates are permanently deleted, and the response includes the count of purged rows

### Requirement: Digest page
The frontend SHALL provide a `/digest` route that displays a grouped feed of active candidates. Each group SHALL show a source header (source name, source type icon, candidate count) and a "Skip All" button for bulk dismiss. Each candidate card SHALL display the title, description or excerpt, thumbnail (if available), source type, and published date. Each card SHALL have a "Save" action and a "Skip" action.

#### Scenario: Viewing the digest page
- **WHEN** a user navigates to `/digest` with active candidates
- **THEN** candidates are displayed grouped by source, each group has a header and "Skip All" button, each card shows preview data with Save and Skip actions

#### Scenario: Empty digest
- **WHEN** a user navigates to `/digest` with no active candidates
- **THEN** the page displays a "You're all caught up" empty state message

#### Scenario: Saving from the digest page
- **WHEN** a user clicks "Save" on a candidate card
- **THEN** the candidate is promoted to a bookmark and the card is removed from the feed

#### Scenario: Dismissing from the digest page
- **WHEN** a user clicks "Skip" on a candidate card
- **THEN** the candidate is dismissed and the card is removed from the feed

#### Scenario: Skip All for a source group
- **WHEN** a user clicks "Skip All" on a source group header
- **THEN** all candidates in that group are dismissed and the group is removed from the feed

### Requirement: Library digest banner
The Library page SHALL display a banner at the top when there are active digest candidates. The banner SHALL show the total candidate count and a brief per-source summary. The banner SHALL link to the `/digest` page. The banner SHALL be dismissible per-session (dismiss hides the banner UI but does not affect candidates).

#### Scenario: Banner displayed
- **WHEN** a user visits the Library page and has active digest candidates
- **THEN** a banner appears above the library header showing count, source summary, and a link to the Digest page

#### Scenario: Banner dismissed
- **WHEN** a user dismisses the library digest banner
- **THEN** the banner is hidden for the remainder of the session but reappears on next page load

#### Scenario: No candidates
- **WHEN** a user visits the Library page with no active candidates
- **THEN** no digest banner is displayed

### Requirement: Sidebar digest navigation
The sidebar SHALL include a "Digest" navigation item positioned between the Library link and the Spaces section. The nav item SHALL display a badge with the count of active candidates (using a 16x16 circular pill, `var(--accent)` background, white text). The badge SHALL only appear when the count is greater than zero.

#### Scenario: Sidebar with candidates
- **WHEN** the sidebar renders and the user has 5 active digest candidates
- **THEN** a "Digest" nav item appears between Library and Spaces with a badge showing "5"

#### Scenario: Sidebar with no candidates
- **WHEN** the sidebar renders and the user has no active candidates
- **THEN** the "Digest" nav item appears without a badge

#### Scenario: Active route highlighting
- **WHEN** the user is on the `/digest` page
- **THEN** the Digest sidebar item is highlighted with the same active style as other nav items

### Requirement: Digest candidate type definition
The shared types package SHALL export a `DigestCandidate` interface that mirrors the `digest_candidates` table structure, with `source_type` narrowed to the `SourceType` union.

#### Scenario: Type available
- **WHEN** a developer imports from `@brain-feed/types`
- **THEN** the `DigestCandidate` type is available with all fields from the digest_candidates table

### Requirement: Mock digest data
The frontend mock data file SHALL export a `mockDigestCandidates` array with at least 8 candidates spanning at least 3 different source types, enabling the Digest UI to be developed and tested before sync workers exist.

#### Scenario: Mock data available
- **WHEN** a developer imports `mockDigestCandidates` from the mock data module
- **THEN** at least 8 realistic candidates are available across multiple source types with varied titles, descriptions, thumbnails, and published dates
