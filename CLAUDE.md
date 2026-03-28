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

The backend is a plain Express app (`apps/backend/src/index.ts`). The frontend is a Vite/React app with a single `App` component. There is no shared package between them yet — each app has its own `node_modules` installed by pnpm.
