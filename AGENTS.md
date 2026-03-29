# AGENTS.md

Guidance for agentic coding agents working in this repository.

## Monorepo Structure

pnpm workspaces monorepo with two apps:

- **`apps/backend`** — Express + TypeScript API, port 3001
- **`apps/frontend`** — React 18 + TypeScript + Vite SPA, port 3000

Shared root `tsconfig.json` is extended by both apps. There is no shared package between them.

---

## Commands

### Root (all apps in parallel/recursive)
```bash
pnpm dev        # start both apps in parallel
pnpm build      # build all apps
pnpm lint       # lint all apps
```

### Backend
```bash
pnpm --filter backend dev     # ts-node-dev with hot reload
pnpm --filter backend build   # tsc → dist/
pnpm --filter backend start   # node dist/index.js
pnpm --filter backend lint    # eslint src --ext .ts
```

### Frontend
```bash
pnpm --filter frontend dev      # vite dev server
pnpm --filter frontend build    # tsc + vite build
pnpm --filter frontend preview  # preview production build
pnpm --filter frontend lint     # tsc --noEmit (type-check only)
```

### Testing
There is currently **no test framework configured** in this repo. No test files exist. When adding tests, choose Vitest (compatible with Vite for frontend; works for backend too). Add a `test` script to the relevant `package.json`.

Running a single test (once Vitest is set up):
```bash
pnpm --filter frontend exec vitest run src/path/to/file.test.tsx
pnpm --filter backend  exec vitest run src/path/to/file.test.ts
```

**Testing policy — always follow these rules when implementing features or fixes:**
- Always run tests after implementing something. If tests do not yet exist for the area you changed, create them.
- You may need to modify your implementation, create new tests, or update existing tests to make them pass.
- Whenever building or modifying frontend features, test the feature visually and interactively using the **Playwright skill** (browser automation). This catches layout, interaction, and rendering issues that unit tests miss.
- Do not consider an implementation complete until all relevant tests pass and frontend changes have been verified via Playwright.

---

## TypeScript

- `strict: true` is enforced everywhere via the root `tsconfig.json`. Do not disable or loosen strict flags.
- Backend: `module: "commonjs"`, `target: "ES2020"`.
- Frontend: `module: "ESNext"`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `noEmit: true` (Vite compiles).
- Use `interface` for component props and entity shapes; use `type` for union/string-literal aliases.
- Annotate event handlers explicitly: `(e: React.FormEvent)`, `(e: React.MouseEvent)`, `(e: React.KeyboardEvent)`.
- Use generic annotations when `useState` initial value is ambiguous: `useState<string | null>(null)`.
- Use `import type { ... }` for type-only imports from other local files.
- Avoid `any`; prefer `unknown` with a type guard when the type is truly unknown.

---

## Code Style

### Formatting
- **Indentation:** 2 spaces (no tabs).
- **Quotes:** Double quotes `"..."` for all strings — imports, JSX attribute values, object literals.
- **Semicolons:** Always present.
- **Trailing commas:** Required in multi-line imports and multi-line object/array literals.
- No Prettier config exists; maintain the above conventions manually.

### Imports
Group imports in this order, separated by blank lines:
1. React and third-party libraries
2. Local layout/shared components
3. Local page components, utilities, data, and types

```typescript
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";

import BookmarkCard from "./components/BookmarkCard";
import type { Bookmark } from "./data/mock";
```

Always import React explicitly at the top of every `.tsx` file even though the JSX transform doesn't require it — this is the established convention.

---

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Component files | PascalCase | `BookmarkCard.tsx`, `AppLayout.tsx` |
| Data / utility files | camelCase | `mock.ts`, `globals.css` |
| React components | `export default function PascalCase` | `export default function BookmarkCard` |
| Props interfaces | `{ComponentName}Props` | `BookmarkCardProps` |
| Union type aliases | PascalCase | `ContentFilter`, `SortOption`, `Step` |
| Variables & state | camelCase | `sidebarCollapsed`, `detailBookmarkId` |
| Event handlers | `handle` + PascalCase | `handleSubmit`, `handleMoreClick` |
| Callback props | `on` + PascalCase | `onCardClick`, `onClose`, `onAddClick` |
| Inline SVG components | PascalCase, defined locally | `const CloseIcon = () => (...)` |
| Style objects | descriptive + `Style` suffix | `cardStyle`, `overlayStyle`, `panelStyle` |
| Mock data exports | `mock` + PascalCase | `mockBookmarks`, `mockSpaces` |
| Route paths | kebab-case | `/forgot-password`, `/spaces/:id/settings` |

---

## React & Frontend Patterns

### Styling
All styling uses **inline `React.CSSProperties` objects** — no CSS modules, no Tailwind, no styled-components. Design tokens are CSS custom properties consumed via `var(--token)`:

```typescript
const cardStyle: React.CSSProperties = {
  background: "var(--bg-raised)",
  borderRadius: 12,
  padding: "16px 20px",
};
```

Always type inline style objects as `React.CSSProperties`. Use CSS variables for all color, font, spacing, and radius tokens; never hard-code color hex values.

### Hover Effects
Hover is handled imperatively via `onMouseEnter`/`onMouseLeave` mutating `e.currentTarget.style` — no `:hover` CSS classes:

```typescript
onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-raised)")}
onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
```

Exception: when hover state affects multiple elements inside a component, use `useState<boolean>(false)` for `hovered`.

### Animations
Use CSS keyframe animations from `globals.css` via inline `animation` style strings. Stagger list items using index-based delays:

```typescript
style={{ animation: `fadeIn 240ms ${index * 40}ms both` }}
```

Available keyframe names: `fadeIn`, `slideInUp`, `spin`, `toastIn`.

### Modal / Panel Visibility
Use a two-phase mount pattern to allow CSS entry/exit transitions:

```typescript
const [visible, setVisible] = useState(false);
// On open: mount component first, then trigger entry animation
requestAnimationFrame(() => setVisible(true));
// On close: trigger exit animation, then unmount after transition
const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };
// Guard: if (!open && !visible) return null;
```

### State Management
Use local `useState` only — there is no global store. Use `useOutletContext<T>()` to pass shared state (e.g., `view`, `onCardClick`) from layout components to nested route pages without prop drilling.

### Data & Types
All entity interfaces and mock data live in `apps/frontend/src/data/mock.ts`. There is no separate `types/` directory. Add new entity types there alongside their mock arrays.

### Inline SVG Icons
Define icon components as small inline functions at the top of the file that needs them — there is no icon library. Only define the icons a file actually uses.

---

## Error Handling

- Guard against missing data with early returns rendering a simple message:
  ```typescript
  if (!space) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Space not found.</p>
      </div>
    );
  }
  ```
- Use optional chaining (`?.`) and nullish coalescing (`??`) liberally.
- Handle image load failures via `onError`: `(e.target as HTMLImageElement).style.display = "none"`.
- Backend: always add error middleware and wrap async route handlers; return JSON error responses.

### Supabase Database

When needed, you can create or insert data in the Supabase database by running SQL scripts (via the Supabase MCP tools). **Never run destructive actions** (DROP, DELETE, TRUNCATE, or destructive ALTER) against the database unless explicitly asked by the user.

---

## CI / CD

GitHub Actions (`.github/workflows/ci.yml`) runs on PRs to `main`:
1. `pnpm install --frozen-lockfile`
2. Lint backend → lint frontend
3. Build backend → build frontend

All lint and build commands must pass before merging. The CI uses Node 20 and the latest pnpm.
