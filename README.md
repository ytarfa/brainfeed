# brain-feed

A bookmark management app for organizing links, notes, images, and files into collaborative spaces — with AI-powered auto-categorization and sync sources.

## Overview

brain-feed lets you save anything to curated **Spaces** (collections you organize by topic or project), browse your full **Library**, share spaces publicly, and collaborate with others. A warm, editorial design system built entirely with custom CSS — no external UI library.

**Current state:** Frontend is feature-complete with mock data. Backend is a minimal Express skeleton ready for expansion.

## Monorepo Structure

```
brain-feed/
├── apps/
│   ├── backend/          # Express + TypeScript API (port 3001)
│   └── frontend/         # React 18 + TypeScript + Vite SPA (port 3000)
├── package.json          # pnpm workspace root
├── pnpm-workspace.yaml
└── tsconfig.json         # Shared TypeScript config
```

## Getting Started

**Prerequisites:** Node.js 18+, pnpm 9+

```bash
# Install dependencies
pnpm install

# Start both apps in parallel
pnpm dev
```

The frontend will be available at `http://localhost:3000` and the backend API at `http://localhost:3001`.

## Commands

### Root (all apps)
```bash
pnpm dev       # start frontend + backend in parallel
pnpm build     # build all apps
pnpm lint      # lint all apps
```

### Frontend only
```bash
cd apps/frontend
pnpm dev       # vite dev server on port 3000
pnpm build     # type-check + vite build
pnpm preview   # preview production build
pnpm lint      # tsc --noEmit (type-check only)
```

### Backend only
```bash
cd apps/backend
pnpm dev       # ts-node-dev with hot reload
pnpm build     # tsc → dist/
pnpm start     # node dist/index.js
pnpm lint      # eslint src --ext .ts
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Routing | React Router v7 |
| Styling | Custom CSS with design tokens (no UI library) |
| Backend framework | Express 4 + TypeScript |
| Package manager | pnpm (workspaces) |

## Features

### Spaces
Organize bookmarks into named collections with color labels, descriptions, and collaborators. Each space can have:
- Sync sources (YouTube, Spotify, Reddit, RSS feeds) that auto-import content
- AI-powered categorization rules
- Public sharing via a share token
- Collaborators with owner / editor / viewer roles

### Library
A unified view of all bookmarks across every space, with:
- Filter by content type: Links, Notes, Images, PDFs, Files
- Sort by date saved, title, or source
- Grid and list view modes

### Bookmark Cards
Each saved item displays a thumbnail, content-type badge, space badge, title, AI-generated summary, tags, and source domain. Cards support:
- Click-to-open detail panel (slide-in from right)
- Hover more-menu: Move to Space, Open Source, Delete
- Staggered fade-in animations

### Bookmark Detail Panel
A side panel with enriched content, editable notes, space assignment, and tag management.

### Global Search
Cmd+K opens a full-screen search overlay across all saved items.

### Activity Log
Per-space log of AI auto-categorization events with Accept / Undo actions.

### Dark Mode
Toggleable from the top bar, persisted to `localStorage`. Warm ink-on-parchment palette in light mode; inverted ink backgrounds in dark mode.

### Auth Pages
Login, Signup, and Forgot Password pages with Google OAuth button and email/password forms.

## Frontend Architecture

```
apps/frontend/src/
├── App.tsx               # BrowserRouter + route definitions
├── layouts/
│   └── AppLayout.tsx     # Sidebar + TopBar shell, <Outlet> for pages
├── pages/
│   ├── auth/             # Login, Signup, ForgotPassword
│   ├── Library.tsx       # All bookmarks, filterable
│   ├── SpaceView.tsx     # Single space + activity log
│   ├── AllSpaces.tsx     # Space grid overview
│   ├── SpaceSettings.tsx
│   ├── PublicSpace.tsx   # Unauthenticated read-only view
│   ├── UserSettings.tsx
│   └── Onboarding.tsx
├── components/           # Bookmark cards, modals, search, sidebar, topbar
├── data/
│   └── mock.ts           # TypeScript types + mock data
└── styles/
    └── globals.css       # CSS custom properties + animations
```

**Routing:** Authenticated routes are nested under `AppLayout`. Public routes (`/login`, `/signup`, `/forgot-password`, `/p/:shareToken`) are siblings at the root level.

**State:** Local `useState` per component; `useOutletContext` shares view mode (grid/list) and click handlers between the layout shell and page-level routes. No global state library.

## Design System

Custom design tokens defined as CSS custom properties.

**Color ramps:**
- **Sand** — backgrounds and borders (`--bg-base: #faf8f4`, `--bg-surface: #f0e9dc`)
- **Terra** — accent and CTAs (`--accent: #d4845a`)
- **Ink** — text (`--text-primary: #1e1c1a`, `--text-secondary: #6a6660`)

**Typography:**
- **Lora** (serif) — display titles, card titles, headings
- **DM Sans** (sans-serif) — body copy, labels, tags, UI chrome

**Animations:** `fadeIn`, `slideInRight`, `slideInUp`, `shimmer` (skeleton), `spin` (sync icon), `toastIn`.

## Backend

Currently a minimal Express scaffold:

```
apps/backend/src/
└── index.ts    # express.json() + GET / health check
```

`GET /` returns `{ message: "Hello from brain-feed backend!" }`.

The backend is ready to be extended with database models, authentication, and REST API routes to back the frontend's mock data layer.

## Environment Variables

| Variable | App | Description |
|---|---|---|
| `PORT` | backend | API port (default: `3001`) |

Future variables to add as the backend grows:
- `DATABASE_URL` — database connection string
- `JWT_SECRET` — token signing secret
- `GOOGLE_OAUTH_ID` / `GOOGLE_OAUTH_SECRET` — Google OAuth credentials
- `FRONTEND_URL` — CORS allowed origin

## Roadmap

- [ ] Database schema + ORM (bookmarks, spaces, users, collaborators)
- [ ] Authentication (JWT or sessions, Google OAuth)
- [ ] REST API routes (CRUD for bookmarks, spaces, tags)
- [ ] Sync sources integration (YouTube, Spotify, Reddit, RSS)
- [ ] AI auto-categorization engine
- [ ] Public space sharing
- [ ] Real-time activity log with accept/undo
- [ ] Mobile-responsive layout
