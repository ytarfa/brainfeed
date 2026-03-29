# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

pnpm workspaces monorepo with two apps under `apps/`:

- **`apps/backend`** — Express + TypeScript API, runs on port 3001
- **`apps/frontend`** — React 18 + TypeScript + Vite SPA, runs on port 3000

## Commands

### Root (runs across all apps)
```bash
pnpm dev       # start both apps in parallel
pnpm build     # build all apps
pnpm lint      # lint all apps
```

### Backend only
```bash
cd apps/backend
pnpm dev       # ts-node-dev with hot reload
pnpm build     # tsc → dist/
pnpm start     # node dist/index.js
pnpm lint      # eslint src --ext .ts
```

### Frontend only
```bash
cd apps/frontend
pnpm dev       # vite dev server
pnpm build     # tsc + vite build
pnpm preview   # preview production build
pnpm lint      # tsc --noEmit (type-check only)
```

## Architecture

The backend is an Express + TypeScript API (`apps/backend/src/index.ts`) with full REST routes under `/api/v1`. The frontend is a Vite/React app. There is no shared package between them yet — each app has its own `node_modules` installed by pnpm.

## Supabase

- **Project name:** brainfeed
- **MCP server:** `@supabase/mcp-server-supabase` — use this to create/edit tables, run SQL, manage RLS policies, and manage storage buckets.
- **Schema migration:** `supabase/migrations.sql` — full schema (tables, indexes, RLS, storage policies). Run in Supabase SQL editor when setting up a fresh project.
- **Auth:** Supabase Auth (email/password + OAuth). The Express API verifies JWTs via `serviceClient.auth.getUser(token)` in `src/middleware/auth.ts`.
- **Two Supabase clients:**
  - `serviceClient` — service role key, bypasses RLS. Used in `public/` routes and admin ops (account deletion, invite lookup).
  - `createUserClient(token)` — per-request, uses the user's JWT so RLS is enforced. Attached to `req.supabase` by the auth middleware.
- **Storage bucket:** `user-uploads` — files stored at `user-uploads/{userId}/{uuid}-{filename}`. Signed URLs returned to client.

## Backend Route Map

All routes prefixed `/api/v1`:

| Method | Path | Description |
|---|---|---|
| GET/POST/PATCH/DELETE | `/bookmarks` | Library CRUD |
| GET/POST/PATCH/DELETE | `/spaces` | Space CRUD |
| POST/DELETE | `/spaces/:id/share` | Share token |
| GET/POST/PATCH/DELETE | `/spaces/:spaceId/rules` | Categorization rules |
| GET/POST/PATCH/DELETE | `/spaces/:spaceId/members` | Collaborators |
| GET | `/spaces/:spaceId/activity` | Activity log |
| GET/POST/PATCH/DELETE | `/sync-sources` | Sync source configs |
| GET | `/search` | Full-text search |
| GET/PATCH | `/settings/profile` | User profile |
| DELETE | `/settings/account` | Delete account |
| GET | `/public/spaces/:shareToken` | Public space view (no auth) |

## Testing

**Always run tests when implementing something.** You may need to modify your implementation, create new tests, or update existing tests to make them pass. Do not consider an implementation complete until all relevant tests pass.

When building or modifying frontend features, test the feature visually and interactively using browser automation (e.g., Playwright). This catches layout, interaction, and rendering issues that unit tests miss.

Test framework: Vitest (not yet configured — set it up if needed). Run tests with:
```bash
pnpm --filter frontend exec vitest run src/path/to/file.test.tsx
pnpm --filter backend  exec vitest run src/path/to/file.test.ts
```
