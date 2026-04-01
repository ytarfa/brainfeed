# Proposal: Integrations and Feeds

## Why

Brain-feed currently only discovers content when users manually save URLs. There is no mechanism for automatically surfacing new content from sources users care about — YouTube channels, GitHub repositories, RSS feeds, subreddits, etc.

The existing `sync_sources` table was scaffolded but never connected: no backend routes, no sync worker, no per-user OAuth infrastructure. The enrichment pipeline uses global API keys, which prevents accessing private/user-specific resources (private GitHub repos, YouTube subscriptions).

Two distinct systems are needed:

1. **Integrations** — a settings-level capability where users connect their accounts (GitHub, Google, etc.) via OAuth. Tokens are stored securely and consumed by both the enrichment pipeline and the feed system.
2. **Feeds** — a content discovery system where users subscribe to sources (RSS feeds, YouTube channels, GitHub repo activity, etc.). A polling worker periodically fetches new items and inserts them as digest candidates, automatically triggering enrichment.

## What Changes

- Drop the unused `sync_sources` table and replace it with two new tables: `user_integrations` and `feeds`
- Store OAuth tokens in Supabase Vault (already installed) with a reference UUID on `user_integrations`
- Build a generic OAuth flow in the backend that supports multiple providers (GitHub, Google initially)
- Create a `FeedProvider` plugin architecture so new feed types can be added with minimal boilerplate
- Build a new `worker-feed-sync` package that polls due feeds on a cron schedule via BullMQ
- Feed items are inserted as bookmarks with `digest_status = 'active'` and automatically enqueued for enrichment
- Upgrade the enrichment pipeline to prefer user-specific tokens (from integrations) over global API keys when available
- Replace the static "Connected accounts" UI in Settings with a real integration management interface
- Add a feed creation wizard that dynamically renders provider-specific forms
- Retarget `bookmarks.source_id` FK from `sync_sources` to `feeds`

## Capabilities

### New Capabilities

- **User Integrations** — OAuth connection management for third-party providers, token storage via Vault, token refresh, provider registry
- **Feeds** — User-created subscriptions to external content sources with configurable sync frequency
- **Feed Sync Worker** — BullMQ-based polling worker with cron scheduler, per-feed-type processing, automatic enrichment enqueue
- **Feed Providers** — Extensible provider system: RSS, YouTube Channel, GitHub Repository (issues/PRs/releases)

### Modified Capabilities

- **Enrichment Pipeline** — Use per-user tokens from integrations when available, fall back to global API keys
- **Digest** — Digest candidates now originate from feeds (via `source_id` FK to `feeds` table)
- **Settings UI** — Connected accounts section becomes functional with real OAuth flows
- **Database Schema** — `sync_sources` dropped, `user_integrations` and `feeds` tables added, `bookmarks.source_id` retargeted

## Impact

- **Backend** — New routes: `/api/v1/integrations` (OAuth flows, list, revoke), `/api/v1/feeds` (CRUD, provider listing)
- **Frontend** — New: integration management UI, feed creation wizard. Modified: Settings connected accounts
- **Database** — Migration: drop `sync_sources`, create `user_integrations` + `feeds`, retarget FK, Vault functions
- **Packages** — New: `packages/worker-feed-sync`. Modified: `packages/worker-core` (integration service), `packages/worker-enrichment` (token passthrough)
- **Infrastructure** — New BullMQ queue for feed sync jobs, cron scheduler
- **Security** — OAuth tokens encrypted at rest via Supabase Vault, never exposed through PostgREST or RLS
