# Design: Integrations and Feeds

## Context

Brain-feed enriches bookmarks saved by users via a LangGraph pipeline with source-specific handlers (GitHub, YouTube, Article, Instagram). These handlers currently use global API keys (`GITHUB_TOKEN`, `GOOGLE_API_KEY`). There is no per-user OAuth token storage and no mechanism for automatic content discovery from external sources.

An unused `sync_sources` table exists with frontend hooks that call non-existent backend routes. The digest system stores candidates as bookmarks with `digest_status` and a `source_id` FK to `sync_sources`.

This change introduces two layered systems: an **integrations** layer for OAuth token management, and a **feeds** layer for automatic content discovery that produces digest candidates.

## Goals / Non-Goals

**Goals:**
- Secure per-user OAuth token storage using Supabase Vault
- Generic OAuth flow supporting multiple providers with a provider registry pattern
- Extensible feed provider architecture where adding a new feed type requires implementing one interface
- Feed sync worker using BullMQ + cron scheduling, consistent with existing worker patterns
- Automatic enrichment of feed-discovered items via the existing pipeline
- Dynamic feed creation wizard driven by provider metadata from the backend

**Non-Goals:**
- Webhook/push-based sync (polling only for now; webhook support is a future enhancement)
- Spotify integration (no clear feed use case yet; integration provider can be added later)
- Reddit integration (defer to a later change; focus on RSS, YouTube, GitHub first)
- Real-time sync or sub-minute polling frequencies
- Feed sharing or collaborative feed management within spaces

## Decisions

### 1. Token Storage in Supabase Vault

**Decision:** Store OAuth tokens (access + refresh) as an encrypted JSON blob in Supabase Vault, referenced by a `vault_secret_id` UUID on the `user_integrations` table. A `security definer` Postgres function retrieves decrypted tokens.

**Alternatives:**
- Application-layer encryption (AES with env key): Simpler but tokens visible in DB dumps; key rotation is manual.
- Separate columns for access/refresh with column-level encryption: More granular but doubles the Vault entries and complicates updates.
- Supabase Auth identity linking: Designed for login, not API token access; tokens not easily retrievable for external API calls.

**Rationale:** Vault is already installed. It provides hardware-backed encryption with keys managed externally by Supabase — tokens are never visible in DB backups or replication. A single JSON blob per integration simplifies token refresh (one `vault.update_secret()` call). The Postgres function keeps Vault access server-side and auditable.

### 2. Separate OAuth Flow from Supabase Auth Login

**Decision:** Implement a standalone OAuth flow for integrations (`/api/v1/integrations/connect/:provider`) independent of the Supabase Auth login flow.

**Alternatives:**
- Extend Supabase Auth OAuth to capture integration tokens during login: Would conflate login with integration consent; scope changes require re-authentication.
- Use Supabase Auth identity linking with extended scopes: Supabase doesn't expose provider tokens through its client API in a way suitable for server-side API calls.

**Rationale:** Separation of concerns — login is login, integration consent is explicit. Users who signed up with email/password can still connect GitHub. Different integrations can request different scopes. The backend fully controls the OAuth state, code exchange, and token storage.

### 3. jsonb Config on Feeds with Zod Validation

**Decision:** Store feed-type-specific configuration in a `config jsonb` column on the `feeds` table, validated at the application layer by per-provider Zod schemas.

**Alternatives:**
- Separate tables per feed type (`rss_feeds`, `github_feeds`, etc.): Type-safe at DB level but requires schema changes for every new feed type; complicates queries across feed types.
- CHECK constraints on config structure: Postgres JSON schema validation is limited and not maintainable.
- Polymorphic inheritance (table-per-type): Overly complex for what is essentially a key-value config.

**Rationale:** jsonb is the pragmatic choice for a plugin architecture. TypeScript + Zod provides strong runtime validation. Adding a new feed type requires no DB migration — just a new provider module. The config is opaque to the database but fully typed and validated in the application.

### 4. New `worker-feed-sync` Package

**Decision:** Create a new `packages/worker-feed-sync` package for the feed sync worker, separate from `worker-enrichment`.

**Alternatives:**
- Add feed sync as a module inside `worker-enrichment`: Shares infrastructure but conflates two fundamentally different scheduling patterns (cron-driven vs. event-driven).
- Run feed sync in the backend process: Couples long-running polling work to the API server lifecycle; harder to scale independently.

**Rationale:** Feed sync is cron-driven (find due feeds, enqueue jobs) while enrichment is event-driven (process jobs as they arrive). They have different scaling profiles and failure modes. Both share `worker-core` for Redis, BullMQ, and Supabase infrastructure — that's what `worker-core` is for.

### 5. Feed Provider Registry with Self-Describing Metadata

**Decision:** Each feed provider implements a `FeedProvider` interface that includes both runtime fetch logic and UI metadata (`configFields`). The backend exposes `GET /api/v1/feeds/providers` returning all provider metadata, and the frontend wizard renders dynamically from this.

**Alternatives:**
- Hardcode feed forms in the frontend per type: Works initially but requires frontend changes for every new provider.
- Define providers only on the backend, frontend only knows about types: Requires coordinated frontend/backend changes for new providers.

**Rationale:** Self-describing providers mean adding a new feed type is a single backend change — implement the interface, register it, done. The frontend wizard automatically picks it up. Provider metadata includes whether an integration is required, enabling the UI to gate on connected accounts.

### 6. Feed Items Become Bookmarks with `digest_status = 'active'`

**Decision:** Feed sync inserts new items as rows in the `bookmarks` table with `digest_status = 'active'`, `source_id` pointing to the feed, and immediately enqueues an enrichment job.

**Alternatives:**
- Separate `feed_items` table: Duplicates bookmark structure; complicates the save-to-library flow.
- Insert as bookmarks without enrichment, enrich on save: Cheaper but worse UX — summaries not ready when user sees candidates.
- Light enrichment on sync, full on save: Two-phase enrichment adds complexity for marginal cost savings.

**Rationale:** The digest system already treats candidates as bookmarks with `digest_status`. Reusing this pattern avoids schema duplication. Eager enrichment ensures summaries, tags, and entities are ready when the user sees the digest — the enrichment pipeline already handles deduplication and error recovery.

### 7. Retarget `bookmarks.source_id` FK from `sync_sources` to `feeds`

**Decision:** Drop the `sync_sources` table (no data exists) and alter `bookmarks.source_id` to reference `feeds(id) on delete set null`.

**Alternatives:**
- Keep `sync_sources` alongside `feeds`: Confusing dual tables with overlapping purpose.
- Rename `sync_sources` to `feeds` with ALTER TABLE: The schema differences are significant enough that a clean replacement is clearer.

**Rationale:** `sync_sources` was never used — no data, no routes, no worker. A clean replacement avoids carrying forward design decisions that no longer fit (non-nullable `space_id`, limited platform CHECK constraint, no `config` jsonb).

## Risks / Trade-offs

- **OAuth complexity**: Each provider has its own OAuth quirks (GitHub uses non-standard token refresh, Google has offline access grants). The provider abstraction must be flexible enough to accommodate these without leaking complexity.
- **Token refresh reliability**: If a refresh token is revoked or expires, the integration enters a broken state. The system needs clear status tracking (`active`/`expired`/`revoked`) and UI for re-authentication.
- **Polling cost**: Frequent polling of many feeds could hit API rate limits (especially GitHub: 5,000 req/hr with user token, YouTube: 10,000 units/day with API key). Feed sync must implement backoff and respect rate limits per provider.
- **Deduplication**: Feed items may appear in multiple syncs. Deduplication by URL + user_id prevents duplicates but requires efficient lookup.
- **Vault access pattern**: Every feed sync job that needs a token must query Vault. For high-frequency feeds this could become a bottleneck. Mitigation: cache decrypted tokens in memory for the duration of a single job (never persist).
- **Migration risk**: Dropping `sync_sources` with `CASCADE` removes the FK on `bookmarks.source_id`. Since no data exists in `sync_sources`, no bookmarks have `source_id` set, so this is safe — but must be verified before migration.

## File Structure

```
packages/
  worker-core/
    src/
      integrations/
        integration-service.ts      # Token CRUD, Vault access, refresh orchestration
        providers/
          index.ts                   # Provider registry
          github.ts                  # GitHub OAuth provider
          google.ts                  # Google OAuth provider
        types.ts                     # IntegrationProvider interface, TokenData, etc.

  worker-feed-sync/
    package.json
    tsconfig.json
    src/
      index.ts                      # BullMQ worker entry + health endpoint
      scheduler.ts                  # Cron: find due feeds, enqueue sync jobs
      feed-sync-processor.ts        # Process a single feed sync job
      feed-item-inserter.ts         # Dedupe, insert bookmark, enqueue enrichment
      providers/
        index.ts                    # FeedProvider registry
        types.ts                    # FeedProvider, FeedProviderMeta, FeedItem interfaces
        rss.ts                      # RSS/Atom feed provider
        youtube-channel.ts          # YouTube channel provider
        github-repo.ts              # GitHub repo issues/PRs/releases provider

  worker-enrichment/
    src/
      enrichment-graph.ts           # Modified: accept optional user token
      services/
        github-service.ts           # Modified: optional token parameter
        youtube-service.ts          # Modified: optional token parameter

apps/
  backend/
    src/
      routes/
        integrations.ts             # OAuth connect/callback/list/revoke
        feeds.ts                    # CRUD, provider listing

  frontend/
    src/
      pages/
        UserSettings.tsx            # Modified: real connected accounts
      components/
        feeds/
          FeedWizard.tsx            # Provider picker + type-specific form
          FeedList.tsx              # List of user's active feeds
          FeedCard.tsx              # Individual feed display
      api/hooks/
        useIntegrations.ts          # Integration CRUD hooks
        useFeeds.ts                 # Feed CRUD + provider listing hooks

packages/types/
  src/
    app.types.ts                    # New: Integration, Feed, FeedProvider app types
    database.types.ts               # Regenerated after migration
```
