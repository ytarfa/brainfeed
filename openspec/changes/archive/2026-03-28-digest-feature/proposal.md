## Why

Brainfeed has sync source configuration (YouTube, RSS, Reddit, Spotify) and a bookmark library, but no triage layer between them. When sync workers eventually pull content, there's nowhere for candidates to land before the user decides what's worth keeping. Without a Digest, incoming content either skips curation entirely (auto-saved, cluttering the library) or requires a sync worker to make opinionated decisions about what to keep. The Digest gives users a fast, low-pressure review session to promote or dismiss incoming content, keeping the library intentional.

## What Changes

- New `digest_candidates` database table for lightweight content candidates with built-in expiry
- New REST API for listing, saving, dismissing, and purging digest candidates
- New `/digest` frontend page with a grouped-feed UI for reviewing candidates
- Library page gains a preview banner showing digest candidate count as a nudge
- Sidebar gains a "Digest" navigation item with a badge count, positioned between Library and Spaces
- Saving a candidate promotes it to a plain bookmark (no space assignment, no AI suggestion)
- Expired candidates are silently purged via a cleanup endpoint (no user-facing expiry notifications)
- Mock/seed data to exercise the feature before sync workers exist

## Capabilities

### New Capabilities
- `digest`: The digest candidate system — database schema, API endpoints, candidate lifecycle (active/saved/dismissed/expired), and the review UI (grouped feed page, library banner, sidebar badge)

### Modified Capabilities
<!-- No existing specs to modify — this is an additive feature -->

## Impact

- **Database**: New `digest_candidates` table with RLS policies, indexes on `user_id`+`status` and `expires_at`
- **Backend**: New `/api/digest` route module; new bookmark creation path (from candidate promotion, no `bookmark_spaces` row)
- **Frontend**: New `DigestPage` component, new `DigestBanner` component in Library, Sidebar modification for Digest nav item + badge
- **Shared types**: New `DigestCandidate` type in `@brain-feed/types`
- **Dependencies**: None new — uses existing Supabase client, Express, React Router
- **Existing code touched**: `Sidebar.tsx` (add nav item), `App.tsx` (add route), `Library.tsx` (add banner), `mock.ts` (add mock candidates), `app.types.ts` (add type)
