# Tasks: Integrations and Feeds

## 1. Database Migration — Drop sync_sources, Create user_integrations and feeds

- [ ] 1.1 Create migration file `supabase/migrations/YYYYMMDDHHMMSS_integrations_and_feeds.sql`
- [ ] 1.2 Drop `sync_sources` table with `CASCADE` (removes FK on `bookmarks.source_id`)
- [ ] 1.3 Create `user_integrations` table with all columns, CHECK constraints, and UNIQUE(user_id, provider)
- [ ] 1.4 Enable RLS on `user_integrations` — read-only policy for authenticated users on own rows; insert/update/delete restricted to service role
- [ ] 1.5 Create `feeds` table with all columns, nullable `space_id`, nullable `integration_id`, CHECK constraint on `sync_frequency`
- [ ] 1.6 Enable RLS on `feeds` — full CRUD policy for authenticated users on own rows
- [ ] 1.7 Create indexes on `feeds`: `(user_id, is_active)` and `(is_active, last_synced_at)`
- [ ] 1.8 Re-add `bookmarks.source_id` FK referencing `feeds(id) on delete set null`
- [ ] 1.9 Create Vault helper function `get_integration_tokens(p_integration_id uuid)` as `security definer` — joins `user_integrations` with `vault.decrypted_secrets` to return decrypted token JSON
- [ ] 1.10 Apply migration via Supabase MCP `apply_migration` tool
- [ ] 1.11 Regenerate TypeScript types (`packages/types/src/database.types.ts`) from the updated schema
- [ ] 1.12 Verify migration: confirm `sync_sources` no longer exists, `user_integrations` and `feeds` tables exist, `bookmarks.source_id` FK targets `feeds`

## 2. Integration Service in worker-core

- [ ] 2.1 Define TypeScript interfaces in `packages/worker-core/src/integrations/types.ts`: `IntegrationProvider`, `TokenData`, `ProviderUserInfo`, `IntegrationTokens`
- [ ] 2.2 Implement GitHub OAuth provider in `packages/worker-core/src/integrations/providers/github.ts`: `buildAuthUrl`, `exchangeCode`, `getUserInfo` (GitHub tokens don't expire, so `refreshToken` is a no-op or throws)
- [ ] 2.3 Implement Google OAuth provider in `packages/worker-core/src/integrations/providers/google.ts`: `buildAuthUrl` (with `access_type=offline`, `prompt=consent`), `exchangeCode`, `refreshToken`, `getUserInfo`
- [ ] 2.4 Create provider registry in `packages/worker-core/src/integrations/providers/index.ts`: map of provider ID → implementation, `getProvider()`, `getAllProviders()`
- [ ] 2.5 Implement `IntegrationService` in `packages/worker-core/src/integrations/integration-service.ts`: `getTokenForUser(userId, provider)` (with lazy refresh), `storeTokens(integrationId, tokens)`, `updateTokens(integrationId, tokens)`, `deleteTokens(integrationId)` — all using Supabase service client to call Vault functions
- [ ] 2.6 Export integration service and types from `packages/worker-core/src/index.ts`
- [ ] 2.7 Write tests for `IntegrationService`: mock Supabase client and Vault RPC calls, test token retrieval, lazy refresh flow, expired token handling
- [ ] 2.8 Write tests for GitHub and Google providers: mock HTTP calls, test `buildAuthUrl`, `exchangeCode`, `refreshToken`, `getUserInfo`
- [ ] 2.9 Run `pnpm --filter worker-core build` and fix any type errors

## 3. Backend Integration Routes

- [ ] 3.1 Create `apps/backend/src/routes/integrations.ts` with Express router
- [ ] 3.2 Implement `POST /api/v1/integrations/connect/:provider` — validate provider, build OAuth URL with encrypted state (user ID + provider), return `{ url }`
- [ ] 3.3 Implement `GET /api/v1/integrations/callback` — decrypt state, exchange code via provider, store tokens in Vault, create/update `user_integrations` row, redirect to frontend settings with success/error query param
- [ ] 3.4 Implement `GET /api/v1/integrations` — list all integrations for authenticated user (no tokens in response)
- [ ] 3.5 Implement `DELETE /api/v1/integrations/:id` — delete integration, delete Vault secret, deactivate associated feeds
- [ ] 3.6 Mount integrations router at `/api/v1/integrations` in `apps/backend/src/index.ts`
- [ ] 3.7 Update account deletion in `apps/backend/src/routes/settings.ts` — replace `sync_sources` deletion with `user_integrations` Vault cleanup and row deletion
- [ ] 3.8 Add env vars for OAuth: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH_STATE_SECRET` (for encrypting state)
- [ ] 3.9 Write tests for integration routes: mock Supabase client and provider calls, test connect URL generation, callback flow, list, delete
- [ ] 3.10 Run `pnpm --filter backend build && pnpm --filter backend lint` and fix any errors

## 4. Backend Feed Routes and Provider Registry

- [ ] 4.1 Define feed provider interfaces and types in `packages/worker-feed-sync/src/providers/types.ts`: `FeedProvider`, `FeedProviderMeta`, `FeedItem`, `ConfigField`
- [ ] 4.2 Implement RSS feed provider in `packages/worker-feed-sync/src/providers/rss.ts`: metadata, Zod config schema, `fetchNewItems` (using `rss-parser`), `resolveDisplayName`
- [ ] 4.3 Implement YouTube channel feed provider in `packages/worker-feed-sync/src/providers/youtube-channel.ts`: metadata, Zod config schema, `fetchNewItems` (using YouTube Data API v3 with `GOOGLE_API_KEY`), `resolveDisplayName`, channel URL/handle resolution
- [ ] 4.4 Implement GitHub repo feed provider in `packages/worker-feed-sync/src/providers/github-repo.ts`: metadata, Zod config schema, `fetchNewItems` (issues, pulls, releases via GitHub REST API with user token), `resolveDisplayName`
- [ ] 4.5 Create provider registry in `packages/worker-feed-sync/src/providers/index.ts`: `registerProvider`, `getProvider`, `getAllProviderMeta`
- [ ] 4.6 Create `apps/backend/src/routes/feeds.ts` with Express router
- [ ] 4.7 Implement `GET /api/v1/feeds/providers` — return all registered provider metadata from the registry
- [ ] 4.8 Implement `POST /api/v1/feeds` — validate `feedType` is registered, validate `config` against provider's Zod schema, check integration requirement, insert feed row, return created feed
- [ ] 4.9 Implement `GET /api/v1/feeds` — list all feeds for authenticated user with joined space name and integration provider
- [ ] 4.10 Implement `PATCH /api/v1/feeds/:id` — update allowed fields (`syncFrequency`, `spaceId`, `isActive`, `displayName`)
- [ ] 4.11 Implement `DELETE /api/v1/feeds/:id` — validate ownership, delete feed
- [ ] 4.12 Mount feeds router at `/api/v1/feeds` in `apps/backend/src/index.ts`
- [ ] 4.13 Write tests for feed routes: mock Supabase client, test CRUD operations, provider validation, integration requirement check
- [ ] 4.14 Write tests for each feed provider: mock HTTP/API calls, test `fetchNewItems` with various `since` values, test config validation
- [ ] 4.15 Run `pnpm --filter backend build && pnpm --filter backend lint` and fix any errors

## 5. Feed Sync Worker Package

- [ ] 5.1 Create `packages/worker-feed-sync/` directory with `package.json`, `tsconfig.json`
- [ ] 5.2 Add dependencies: `@brain-feed/worker-core`, `@brain-feed/types`, `bullmq`, `rss-parser`
- [ ] 5.3 Register in `pnpm-workspace.yaml` and run `pnpm install`
- [ ] 5.4 Implement scheduler in `packages/worker-feed-sync/src/scheduler.ts`: query due feeds, enqueue jobs with feed ID as job ID (deduplication), run on interval
- [ ] 5.5 Implement feed sync processor in `packages/worker-feed-sync/src/feed-sync-processor.ts`: load provider, get token if needed, call `fetchNewItems`, pass items to inserter, update `last_synced_at` and `last_sync_error`
- [ ] 5.6 Implement feed item inserter in `packages/worker-feed-sync/src/feed-item-inserter.ts`: deduplicate by URL + user_id, insert bookmark with digest fields, enqueue enrichment job
- [ ] 5.7 Implement worker entry point in `packages/worker-feed-sync/src/index.ts`: create BullMQ queue and worker for `feed-sync`, start scheduler, start health endpoint on port 3003
- [ ] 5.8 Add `dev`, `build`, `start` scripts to `package.json`
- [ ] 5.9 Write tests for scheduler: mock Supabase query, verify correct feeds are enqueued
- [ ] 5.10 Write tests for feed sync processor: mock provider, integration service, and inserter; test happy path, missing token, fetch error handling
- [ ] 5.11 Write tests for feed item inserter: mock Supabase insert and enrichment queue; test deduplication, bookmark field mapping, enrichment enqueue
- [ ] 5.12 Add `worker-feed-sync` service to `docker-compose.yml` with Redis dependency and health port
- [ ] 5.13 Run `pnpm --filter worker-feed-sync build` and fix any type errors

## 6. Enrichment Pipeline Token Passthrough

- [ ] 6.1 Modify `packages/worker-enrichment/src/enrichment-graph.ts`: accept optional `userId` in enrichment state, pass to source-specific handlers
- [ ] 6.2 Modify `GitHubService` to accept an optional `token` parameter, use it instead of `GITHUB_TOKEN` when provided
- [ ] 6.3 Modify `YouTubeService` to accept an optional `token` parameter, use it instead of `GOOGLE_API_KEY` when provided
- [ ] 6.4 In the `githubNode` and `youtubeNode` handlers: attempt to get user token via `IntegrationService.getTokenForUser()`, fall back to global env var if not available
- [ ] 6.5 Update enrichment job data type to include optional `userId` field
- [ ] 6.6 Write tests: verify token passthrough works, verify fallback to global key when no integration exists
- [ ] 6.7 Run `pnpm --filter worker-enrichment build` and fix any type errors

## 7. App-Layer Types

- [ ] 7.1 Add `Integration` interface to `packages/types/src/app.types.ts`
- [ ] 7.2 Add `Feed` interface to `packages/types/src/app.types.ts`
- [ ] 7.3 Add `FeedProviderMeta` and `ConfigField` interfaces to `packages/types/src/app.types.ts`
- [ ] 7.4 Export all new types from the package index
- [ ] 7.5 Run `pnpm --filter types build` and fix any type errors

## 8. Frontend Integration Management

- [ ] 8.1 Create `apps/frontend/src/api/hooks/useIntegrations.ts`: `useIntegrations()` (list), `useConnectIntegration()` (POST connect), `useRevokeIntegration()` (DELETE)
- [ ] 8.2 Modify `apps/frontend/src/pages/UserSettings.tsx`: replace static `accountsList` with data from `useIntegrations()` hook
- [ ] 8.3 Implement "Connect" button: calls `useConnectIntegration`, receives OAuth URL, redirects browser to it
- [ ] 8.4 Implement OAuth return handling: detect success/error query params on settings page load, show toast notification
- [ ] 8.5 Implement "Disconnect" button: show confirmation dialog, call `useRevokeIntegration`, update UI
- [ ] 8.6 Show provider status: connected providers display username and avatar from integration data; disconnected providers show "Connect" button
- [ ] 8.7 Write tests for useIntegrations hooks: mock API calls, test list/connect/revoke flows
- [ ] 8.8 Visually verify Settings → Connected Accounts using Playwright: test connected/disconnected states, connect button navigation, disconnect confirmation
- [ ] 8.9 Run `pnpm --filter frontend build && pnpm --filter frontend lint` and fix any errors

## 9. Frontend Feed Management

- [ ] 9.1 Create `apps/frontend/src/api/hooks/useFeeds.ts`: `useFeeds()`, `useCreateFeed()`, `useUpdateFeed()`, `useDeleteFeed()`, `useFeedProviders()`
- [ ] 9.2 Remove or deprecate `apps/frontend/src/api/hooks/useSyncSources.ts` and update the hooks index
- [ ] 9.3 Create `apps/frontend/src/components/feeds/FeedCard.tsx`: display name, icon, type label, last synced, frequency, active/paused toggle, error indicator, delete button
- [ ] 9.4 Create `apps/frontend/src/components/feeds/FeedList.tsx`: list of FeedCards with empty state and "Add Feed" button
- [ ] 9.5 Create `apps/frontend/src/components/feeds/FeedWizard.tsx`: modal wizard with provider picker (Step 1) and dynamic config form (Step 2), sync frequency selector, optional space assignment
- [ ] 9.6 In the wizard, handle the "requires integration" gate: if provider needs an integration the user hasn't connected, show a prompt to connect first
- [ ] 9.7 Integrate feed management into the app: add a Feeds page or section accessible from the sidebar/settings
- [ ] 9.8 Write tests for useFeeds hooks: mock API calls, test CRUD operations
- [ ] 9.9 Visually verify Feed Wizard using Playwright: test provider selection, form rendering for each provider type, creation flow, integration gate
- [ ] 9.10 Visually verify Feed List using Playwright: test feed display, toggle, delete, error indicator
- [ ] 9.11 Run `pnpm --filter frontend build && pnpm --filter frontend lint` and fix any errors

## 10. End-to-End Verification

- [ ] 10.1 Start all services (backend, frontend, enrichment worker, feed sync worker, Redis) via `docker-compose up` or manual start
- [ ] 10.2 Test full OAuth flow: connect GitHub integration from Settings → callback → verify token stored in Vault → verify integration appears in UI
- [ ] 10.3 Test feed creation: create an RSS feed via the wizard → verify feed row in DB → verify scheduler picks it up → verify items appear as digest candidates
- [ ] 10.4 Test YouTube channel feed: create a YouTube channel feed → verify new videos appear as digest candidates with enrichment
- [ ] 10.5 Test GitHub repo feed: connect GitHub → create a GitHub repo feed for issues → verify new issues appear as digest candidates
- [ ] 10.6 Test enrichment token passthrough: save a private GitHub URL as a bookmark → verify enrichment uses the user's GitHub token instead of global key
- [ ] 10.7 Test integration revocation: disconnect GitHub → verify associated feeds are deactivated → verify feed list shows error state
- [ ] 10.8 Run full lint and build: `pnpm lint && pnpm build` — all packages and apps must pass
