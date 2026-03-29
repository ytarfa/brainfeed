## 1. Database & Types

- [x] 1.1 Create Supabase migration for `digest_candidates` table with RLS policies and indexes (user_id+status composite, expires_at)
- [x] 1.2 Regenerate Supabase TypeScript types to include the new table
- [x] 1.3 Add `DigestCandidate` interface to `packages/types/src/app.types.ts` and re-export from index
- [x] 1.4 Add `mockDigestCandidates` array to `apps/frontend/src/data/mock.ts` with 8+ candidates across 3+ source types

## 2. Backend API

- [x] 2.1 Create `apps/backend/src/routes/digest.ts` route module with Express Router
- [x] 2.2 Implement `GET /api/digest` — return active non-expired candidates grouped by source
- [x] 2.3 Implement `GET /api/digest/summary` — return total count and per-source breakdown
- [x] 2.4 Implement `POST /api/digest/:id/save` — promote candidate to bookmark (no bookmark_spaces), set candidate status to 'saved'
- [x] 2.5 Implement `POST /api/digest/:id/dismiss` — set candidate status to 'dismissed'
- [x] 2.6 Implement `POST /api/digest/dismiss-all` — bulk dismiss all active candidates for user
- [x] 2.7 Implement `POST /api/digest/dismiss-group` — dismiss by source_id or source_type
- [x] 2.8 Implement `DELETE /api/digest/expired` — purge expired and dismissed candidates
- [x] 2.9 Register digest router in the main Express app (e.g., `app.use("/api/digest", authMiddleware, digestRouter)`)

## 3. Frontend — Digest Page

- [x] 3.1 Create `apps/frontend/src/pages/DigestPage.tsx` with grouped feed layout
- [x] 3.2 Implement source group headers with source name, type icon, count, and "Skip All" button
- [x] 3.3 Implement candidate cards with title, description, thumbnail, source type, published date, Save and Skip actions
- [x] 3.4 Implement "You're all caught up" empty state
- [x] 3.5 Wire up API calls for save, dismiss, dismiss-group (optimistic UI removal of cards/groups)
- [x] 3.6 Add `/digest` route to `apps/frontend/src/App.tsx` inside the authenticated layout

## 4. Frontend — Sidebar & Library Banner

- [x] 4.1 Add "Digest" nav item to `Sidebar.tsx` between Library and Spaces with NavLink to `/digest`
- [x] 4.2 Add badge count to Digest sidebar item (16x16 circular pill, var(--accent), conditional on count > 0)
- [x] 4.3 Create `DigestBanner` component showing candidate count, per-source summary, and link to `/digest`
- [x] 4.4 Integrate `DigestBanner` at the top of `Library.tsx` (above header), dismissible per-session via local state
- [x] 4.5 Fetch digest summary data for sidebar badge and library banner (via `GET /api/digest/summary`)

## 5. Integration & Verification

- [x] 5.1 Seed digest_candidates table with test data (matching mock data shape) for local development
- [x] 5.2 Verify full flow: digest page loads grouped candidates → save promotes to bookmark → dismiss removes from feed → empty state appears
- [x] 5.3 Verify sidebar badge updates after save/dismiss actions
- [x] 5.4 Verify library banner shows/hides correctly and links to digest page
- [x] 5.5 Run `pnpm lint` and `pnpm build` to ensure no type errors or lint failures
