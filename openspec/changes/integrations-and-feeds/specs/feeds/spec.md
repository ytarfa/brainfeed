# Feeds

## ADDED Requirements

### Requirement: feeds database table

The `feeds` table stores user-created subscriptions to external content sources.

#### Scenario: Table schema

WHEN the migration is applied
THEN the `feeds` table exists with columns:
  - `id` uuid primary key (default `gen_random_uuid()`)
  - `user_id` uuid not null, FK to `profiles(id)` on delete cascade
  - `space_id` uuid nullable, FK to `spaces(id)` on delete set null
  - `integration_id` uuid nullable, FK to `user_integrations(id)` on delete set null
  - `feed_type` text not null (e.g. `'rss'`, `'youtube_channel'`, `'github_repo'`)
  - `config` jsonb not null default `'{}'`
  - `display_name` text not null
  - `display_icon` text (URL or emoji)
  - `sync_frequency` text not null default `'1h'`, CHECK in (`'15min'`, `'1h'`, `'6h'`, `'daily'`)
  - `last_synced_at` timestamptz (nullable — null means never synced)
  - `last_sync_error` text (nullable — stores last error message for display)
  - `is_active` boolean not null default `true`
  - `created_at` timestamptz not null default `now()`
  - `updated_at` timestamptz not null default `now()`
AND RLS is enabled with a policy allowing authenticated users to CRUD their own feeds
AND an index exists on `(user_id, is_active)` for efficient feed listing
AND an index exists on `(is_active, last_synced_at)` for the scheduler query

### Requirement: Drop sync_sources and retarget bookmarks.source_id

#### Scenario: Migration from sync_sources to feeds

WHEN the migration is applied
THEN the `sync_sources` table is dropped with CASCADE
AND the `bookmarks.source_id` column is altered to reference `feeds(id) on delete set null`
AND the existing `bookmarks_source_id_idx` index (if any) is recreated for the new FK

### Requirement: Backend CRUD routes for feeds

#### Scenario: Listing feeds

WHEN a GET request is made to `/api/v1/feeds`
THEN it returns all feeds for the authenticated user
AND each feed includes: `id`, `feedType`, `config`, `displayName`, `displayIcon`, `syncFrequency`, `lastSyncedAt`, `lastSyncError`, `isActive`, `spaceName` (joined if `space_id` is set), `integrationProvider` (joined if `integration_id` is set), `createdAt`
AND feeds are ordered by `created_at` descending

#### Scenario: Creating a feed

WHEN a POST request is made to `/api/v1/feeds` with body `{ feedType, config, displayName, spaceId?, syncFrequency? }`
THEN the backend validates:
  - `feedType` is a registered provider
  - `config` passes the provider's Zod schema validation
  - If the provider requires an integration, the user has an active integration for the required provider
  - If `spaceId` is provided, the user has access to that space
AND the feed is inserted into the database
AND the response includes the created feed
AND if the provider requires an integration, `integration_id` is automatically set to the user's active integration for that provider

#### Scenario: Creating a feed without required integration

WHEN a POST request attempts to create a feed for a provider that requires an integration
AND the user does not have an active integration for the required provider
THEN the request fails with 400 and an error indicating which integration is needed

#### Scenario: Updating a feed

WHEN a PATCH request is made to `/api/v1/feeds/:id` with body `{ syncFrequency?, spaceId?, isActive?, displayName? }`
THEN the backend validates the feed belongs to the authenticated user
AND updates only the provided fields
AND sets `updated_at` to `now()`

#### Scenario: Deleting a feed

WHEN a DELETE request is made to `/api/v1/feeds/:id`
THEN the backend validates the feed belongs to the authenticated user
AND the feed row is deleted
AND existing bookmarks with `source_id` pointing to this feed have their `source_id` set to null (FK on delete set null)

#### Scenario: Listing available feed providers

WHEN a GET request is made to `/api/v1/feeds/providers`
THEN it returns an array of all registered feed providers with metadata:
  - `type`: string identifier
  - `displayName`: human-readable name
  - `icon`: icon identifier
  - `description`: brief description
  - `requiresIntegration`: boolean
  - `requiredProvider`: string or null
  - `configFields`: array of field definitions for the UI form

### Requirement: Feed app-layer types

#### Scenario: Feed type definition

WHEN feed data is used in the frontend or API responses
THEN it conforms to the `Feed` interface:
  - `id`: string
  - `feedType`: string
  - `config`: Record<string, unknown>
  - `displayName`: string
  - `displayIcon`: string | null
  - `syncFrequency`: string
  - `lastSyncedAt`: string | null
  - `lastSyncError`: string | null
  - `isActive`: boolean
  - `spaceId`: string | null
  - `spaceName`: string | null
  - `integrationProvider`: string | null
  - `createdAt`: string

#### Scenario: FeedProviderMeta type definition

WHEN feed provider metadata is used in the frontend
THEN it conforms to the `FeedProviderMeta` interface:
  - `type`: string
  - `displayName`: string
  - `icon`: string
  - `description`: string
  - `requiresIntegration`: boolean
  - `requiredProvider`: string | null
  - `configFields`: ConfigField[]

#### Scenario: ConfigField type definition

WHEN config fields are used to render the feed wizard form
THEN each field conforms to the `ConfigField` interface:
  - `key`: string
  - `label`: string
  - `type`: `'text' | 'select' | 'multiselect' | 'toggle'`
  - `placeholder`: string (optional)
  - `required`: boolean
  - `options`: `{ label: string; value: string }[]` (optional, for select/multiselect)

### Requirement: Frontend feed management

#### Scenario: Feed list view

WHEN a user navigates to a feeds management page (or section within settings/library)
THEN all feeds are displayed as cards showing:
  - Display name and icon
  - Feed type label
  - Last synced time (relative, e.g. "2 hours ago")
  - Sync frequency
  - Active/paused status
  - Space assignment (if any)
  - Error indicator (if `lastSyncError` is set)

#### Scenario: Feed creation wizard

WHEN a user clicks "Add Feed"
THEN a wizard is shown with:
  - Step 1: Provider picker — grid of available feed types fetched from `GET /api/v1/feeds/providers`
  - Step 2: Configuration form — rendered dynamically from the selected provider's `configFields`
  - If the selected provider requires an integration the user hasn't connected, a prompt to connect is shown with a "Connect" button
  - Sync frequency selector (default: "Every hour")
  - Optional space assignment dropdown
AND on submission, the feed is created via `POST /api/v1/feeds`

#### Scenario: Feed toggle and deletion

WHEN a user toggles a feed's active state
THEN a PATCH request updates `is_active`
WHEN a user deletes a feed
THEN a confirmation dialog is shown
AND on confirm, a DELETE request removes the feed

### Requirement: Frontend hooks

#### Scenario: useFeeds hook

WHEN the frontend needs to list feeds
THEN `useFeeds()` calls `GET /api/v1/feeds` and returns the feed list with loading/error states

#### Scenario: useCreateFeed hook

WHEN the frontend creates a feed
THEN `useCreateFeed()` calls `POST /api/v1/feeds` and invalidates the feed list cache on success

#### Scenario: useUpdateFeed hook

WHEN the frontend updates a feed
THEN `useUpdateFeed()` calls `PATCH /api/v1/feeds/:id` and invalidates the feed list cache

#### Scenario: useDeleteFeed hook

WHEN the frontend deletes a feed
THEN `useDeleteFeed()` calls `DELETE /api/v1/feeds/:id` and invalidates the feed list cache

#### Scenario: useFeedProviders hook

WHEN the frontend needs provider metadata for the wizard
THEN `useFeedProviders()` calls `GET /api/v1/feeds/providers` and caches the result (providers rarely change)

## MODIFIED Requirements

### Requirement: Account deletion cleanup

#### Scenario: Deleting feeds on account deletion

WHEN a user deletes their account via `DELETE /api/v1/settings/account`
THEN the existing `sync_sources` deletion is replaced with `feeds` deletion
AND all feeds for the user are deleted (cascade from profiles handles this)
