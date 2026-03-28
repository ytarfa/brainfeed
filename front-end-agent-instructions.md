# Brainfeed — Front-End Agent Instructions

> **Purpose:** This document is a single-source reference for any front-end agent building the Brainfeed UI. It combines the brand system (color, type, logo) with the full page/component breakdown and build order so every screen ships on-brand from the first commit.

---

## 1. Design System

### 1.1 Color Palette

Brainfeed uses a warm, editorial palette. No cold tech grays — everything leans organic and paper-like.

#### Sand Ramp — backgrounds, borders, muted text

| Token Name | Hex       | Role                         |
| ---------- | --------- | ---------------------------- |
| Parchment  | `#FAF8F4` | Lightest background          |
| Linen      | `#F0E9DC` | Surface / sidebar background |
| Sand       | `#E2D4C0` | Borders, dividers            |
| Oat        | `#C8B49A` | Muted text, disabled states  |
| Stone      | `#A8916E` | Secondary icons              |
| Bark       | `#7A6449` | Strong muted text            |

#### Terra Ramp — primary accent, CTAs, highlights

| Token Name | Hex       | Role                                              |
| ---------- | --------- | ------------------------------------------------- |
| Terra 50   | `#FDF0E8` | Accent-subtle (tag/badge bg)                      |
| Terra 100  | `#F9D8BC` | Hover states on accent elements                   |
| Terra 200  | `#EEB990` | Active/pressed accent                             |
| Terra      | `#D4845A` | **Primary accent — buttons, links, active icons** |
| Terra 600  | `#B5623A` | Accent hover on dark surfaces                     |
| Walnut     | `#8B5E3C` | Accent pressed / dark accent text                 |

#### Ink Ramp — text, dark surfaces, dark mode backgrounds

| Token Name | Hex       | Role                        |
| ---------- | --------- | --------------------------- |
| White      | `#FAF8F4` | Text on dark backgrounds    |
| Fog        | `#EDEAE4` | Secondary text (dark mode)  |
| Ash        | `#D0CDC6` | Borders (dark mode)         |
| Smoke      | `#9A968F` | Muted text                  |
| Slate      | `#6A6660` | Secondary text (light mode) |
| Ink        | `#1E1C1A` | Primary text, dark mode bg  |

### 1.2 Design Tokens

Implement these as CSS custom properties on `:root` and `[data-theme="dark"]`.

#### Light Mode

```css
:root {
  --bg-base: #faf8f4; /* Page background (Parchment) */
  --bg-surface: #f0e9dc; /* Cards, panels, sidebars (Linen) */
  --bg-raised: #faf8f4; /* Elevated cards (White/Parchment) */
  --border-subtle: #e2d4c0; /* Default borders (Sand) */
  --border-strong: #c8b49a; /* Focus rings, emphasis (Oat) */
  --text-primary: #1e1c1a; /* Body text, headings (Ink) */
  --text-secondary: #6a6660; /* Supporting text (Slate) */
  --text-muted: #9a968f; /* Timestamps, hints, placeholders (Smoke) */
  --accent: #d4845a; /* Buttons, links, active icons (Terra) */
  --accent-subtle: #fdf0e8; /* Tag/badge backgrounds (Terra 50) */
  --accent-text: #b5623a; /* Text on accent-subtle backgrounds (Terra 600) */
}
```

#### Dark Mode

```css
[data-theme="dark"] {
  --bg-base: #1e1c1a; /* Page background (Ink) */
  --bg-surface: #2a2725; /* Cards, panels (derived warm dark) */
  --bg-raised: #36322f; /* Elevated cards (derived warm dark) */
  --border-subtle: #3e3a36; /* Default borders */
  --border-strong: #6a6660; /* Focus rings (Slate) */
  --text-primary: #faf8f4; /* Body text (Parchment) */
  --text-secondary: #edeae4; /* Supporting text (Fog) */
  --text-muted: #9a968f; /* Timestamps, hints (Smoke) */
  --accent: #d4845a; /* Same in both modes */
  --accent-subtle: #3a2a20; /* Tag/badge backgrounds (dark warm) */
  --accent-text: #eeb990; /* Text on dark accent-subtle (Terra 200) */
}
```

> **Key rule:** `--accent: #D4845A` is identical in both themes. This is the brand's recognizable constant.

> **Key rule:** Dark mode uses warm Ink tones (`#1E1C1A`), not neutral charcoal. The app should feel like a cozy reading app at night.

> **Key rule:** Three surface layers (base → surface → raised) provide depth for sidebar, card list, and individual cards. Avoid box-shadows as the primary depth cue — rely on background color stepping instead.

#### Semantic Colors

```css
:root {
  --color-success: #4a7a5b; /* Sync status, positive states */
  --color-warning: #d4845a; /* Reuse Terra for warnings */
  --color-error: #c0392b; /* Errors, failed syncs, destructive actions */
}
```

### 1.3 Typography

Two typefaces with distinct roles. Load from Google Fonts:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;1,500&family=DM+Sans:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

#### Typeface Roles

| Typeface    | Role                             | Where                                                        |
| ----------- | -------------------------------- | ------------------------------------------------------------ |
| **Lora**    | Display & content titles (serif) | Bookmark titles, article headings, Space names, display text |
| **DM Sans** | UI & body (geometric sans-serif) | Labels, metadata, tags, buttons, navigation, body copy       |

#### Type Scale — implement as CSS custom properties or utility classes

| Token                | Font        | Weight | Size | Line Height | Letter Spacing | Usage                                   |
| -------------------- | ----------- | ------ | ---- | ----------- | -------------- | --------------------------------------- |
| `--text-display`     | Lora        | 500    | 28px | 1.2         | normal         | Space title (page header)               |
| `--text-title`       | Lora        | 500    | 20px | 1.3         | normal         | Bookmark title, article heading         |
| `--text-card`        | Lora        | 500    | 15px | 1.35        | normal         | Card title in bookmark list             |
| `--text-card-italic` | Lora italic | 500    | 15px | 1.35        | normal         | Article or paper title on cards         |
| `--text-body`        | DM Sans     | 400    | 14px | 1.6         | normal         | Summary, excerpt, description           |
| `--text-label`       | DM Sans     | 500    | 11px | normal      | 0.06em         | Section labels, Space names (UPPERCASE) |
| `--text-meta`        | DM Sans     | 400    | 11px | normal      | normal         | `github.com · saved 3 min ago`          |
| `--text-tag`         | DM Sans     | 500    | 10px | normal      | normal         | Tags: `Dev tools · New · ML`            |

#### Typography Rules

1. **Lora** for all content titles — bookmark names, article headings, Space titles. Serif conveys importance.
2. **Lora italic** specifically for article and paper titles (editorial convention: published works in italic).
3. **DM Sans** for everything else — labels, metadata, tags, buttons, nav, body copy.
4. **Spaced uppercase DM Sans** (`letter-spacing: 0.06em; text-transform: uppercase`) only for section labels and Space name badges.
5. **Two weights only: 400 and 500.** Never use 600 or 700. The warm palette carries visual weight.

### 1.4 Logo

The logo uses a lowercase Lora `b` paired with a period: **b.**

#### Variants

| Variant        | Composition                                 | Min Width               | When to Use                          |
| -------------- | ------------------------------------------- | ----------------------- | ------------------------------------ |
| Primary lockup | `b.` mark + `brainfeed` wordmark (Lora 500) | 120px                   | Main nav, marketing pages            |
| Wordmark only  | `brainfeed` in Lora 500 lowercase           | 80px                    | Where the mark is already visible    |
| Mark only      | `b.`                                        | 24px (16px for favicon) | App icon, favicon, browser extension |

#### Color by Background

| Background        | Mark Color      | Wordmark Color      |
| ----------------- | --------------- | ------------------- |
| Parchment (light) | Terra `#D4845A` | Ink `#1E1C1A`       |
| Ink (dark)        | Terra `#D4845A` | Parchment `#FAF8F4` |
| Terra             | White `#FAF8F4` | White `#FAF8F4`     |

---

## 2. Layout Shell

### 2.1 App Structure

```
┌──────────────────────────────────────────────────┐
│  Sidebar (bg-surface)  │  Main Content (bg-base) │
│                        │                         │
│  b. brainfeed          │  ┌─ Top bar ──────────┐ │
│                        │  │ Search  [+ Add] ... │ │
│  ─────────────         │  └────────────────────┘ │
│  SPACES (label)        │                         │
│   Dev Tools      ●     │  ┌─ Content area ─────┐ │
│   Learning — ML  ↻     │  │                     │ │
│   Recipes              │  │  Card grid / list   │ │
│   ...                  │  │                     │ │
│                        │  └─────────────────────┘ │
│  ─────────────         │                         │
│  + New Space           │                         │
│  ⚙ Settings            │                         │
└──────────────────────────────────────────────────┘
```

- **Sidebar:** Collapsible. `--bg-surface` background. Lists all Spaces with indicators for shared (collaborator avatar dots) vs. solo, and sync-active Spaces (sync icon). Logo lockup at top.
- **Main content area:** `--bg-base` background. Top bar contains global search, the Add/Save button, and view toggle (grid/list).
- **Cards:** Use `--bg-raised` for individual bookmark cards sitting on top of `--bg-base`.

---

## 3. Pages — Specs & Requirements

### 3.1 Auth Pages

**Routes:** `/login`, `/signup`, `/forgot-password`

- Centered card layout on `--bg-base`.
- Email/password fields + OAuth buttons (Google, etc.).
- Logo (primary lockup) above the form.
- All form labels use `--text-label` style. Input fields use `--text-body`.
- CTA button uses `--accent` background with white text.

### 3.2 Main Library (`/library`)

The primary view after login. Shows all saved items across all Spaces.

**Features to implement:**

- **View toggle:** List view / Grid view for bookmark cards.
- **Filter bar:** Filter by content type — link, note, image, PDF, file. Use tag-style pills with `--accent-subtle` bg and `--accent-text`.
- **Sort controls:** Date saved, source, title.
- **Search bar:** Full-text search across all content. Appears in top bar.
- **Empty state:** Illustrated prompt to save the first item or install the browser extension.

### 3.3 Space View (`/spaces/:id`)

Same card layout as Library, scoped to a single Space.

**Additional elements:**

- **Space header:** Space name in `--text-display` (Lora 500 28px). Description text in `--text-body`. Collaborator avatar stack to the right.
- **Activity log panel:** Expandable side panel or bottom drawer showing auto-categorization history. Each entry has accept/undo actions.
- **Space settings button:** Gear icon, opens Space Settings page.

### 3.4 Space Settings (`/spaces/:id/settings`)

A settings panel (could be a separate page or a wide drawer).

**Sections:**

1. **General:** Rename Space, delete Space (destructive, use `--color-error` for button).
2. **Categorization rules:** List of user-defined rules (e.g., `domain = github.com`). Add/edit/delete interface. Toggle for AI auto-categorization on/off.
3. **Collaborators:** Invite by email, list current collaborators with roles, remove button.
4. **Sync sources:** Connect/disconnect YouTube, Spotify, RSS, Reddit. Each source shows connection status (use `--color-success` for synced). Configure sync frequency (dropdown) and target Space.
5. **Public sharing:** Generate / revoke a public share link. Show the link with a copy button.

### 3.5 All Spaces (`/spaces`)

Grid of Space cards showing:

- Space name (`--text-card`, Lora)
- Item count (`--text-meta`)
- Collaborator avatar stack (if shared)
- Sync indicator icon (if sync sources connected)

**Actions:**

- **Create new Space button** — primary CTA using `--accent`.

### 3.6 Public Space View (`/p/:shareToken`)

- Read-only view. No auth required.
- No sidebar. No edit controls.
- Space header with name and description.
- Bookmark cards in grid or list (read-only — no quick-action menus).
- Brainfeed branding in a minimal footer or top bar.

### 3.7 Bookmark Detail (Expanded View)

Opens as a **slide-over panel** from the right (not a separate route).

**Contents:**

- Enriched content render, adapting by source type:
  - **GitHub:** README rendered as markdown, language breakdown, star count.
  - **Twitter/X:** Unrolled thread text.
  - **News/blog:** Extracted article body, author, publish date.
  - **YouTube:** Title, description, transcript summary, channel info.
  - **Amazon:** Price, rating, images, key specs.
  - **Academic paper/PDF:** Title, authors, abstract, key findings.
  - **Generic URL:** OpenGraph metadata, page title, generated summary.
  - **Non-link content:** Text note, image viewer, PDF viewer, file info.
- **User notes field:** Editable textarea (`--text-body`).
- **Space assignment selector:** Dropdown/pill selector to move item between Spaces.
- **Tags:** Editable tag row. Tags use `--text-tag` style with `--accent-subtle` bg.
- **Source link:** External link button to original URL.

### 3.8 User Settings (`/settings`)

- **Profile:** Name, email, avatar upload.
- **Connected accounts:** OAuth connections for sync sources (YouTube, Spotify, Reddit, RSS).
- **Notification preferences:** Toggles.
- **Danger zone:** Delete account button (`--color-error`).

### 3.9 Onboarding Flow

Post-signup wizard (3–4 steps):

1. Create first Space (name + optional description).
2. Install browser extension prompt (with link).
3. Connect first sync source (optional, skippable).
4. Done — redirect to Library.

---

## 4. UI Components

### 4.1 Bookmark Card

The core repeating unit. Needs variants by content type:

| Type  | Visual Treatment                                               |
| ----- | -------------------------------------------------------------- |
| Link  | Favicon + enriched preview (thumbnail, title, summary snippet) |
| Note  | Text icon + note body preview                                  |
| Image | Image thumbnail                                                |
| PDF   | PDF icon + title + page count                                  |
| File  | File type icon + filename                                      |

**Every card shows:**

- Title in `--text-card` (Lora 500 15px). Use `--text-card-italic` for article/paper titles.
- Source type badge (small colored pill, `--text-tag`).
- Space tag (if viewing Library, show which Space it belongs to).
- Source domain + timestamp in `--text-meta`.
- Quick-action menu (⋯): Move to Space, Delete, Open source URL.

**Card background:** `--bg-raised`. Border: 1px `--border-subtle`. On hover: border shifts to `--border-strong`.

### 4.2 Save / Add Item Modal

Triggered from the `[+ Add]` button in the top bar (or via a `Cmd+K` / `Ctrl+K` shortcut).

- **Input field:** Accepts a URL or lets user upload a file / paste text.
- **Enrichment loading state:** After submission, show a skeleton/shimmer on the card fields while Brainfeed pulls enriched data from the source.
- **Space selector:** Optional — pick a target Space before saving, or let AI suggest.

### 4.3 AI Suggestion Toast/Modal

Triggered when a new item is saved and AI suggests a Space:

- Compact toast or small modal at bottom-right.
- Shows: "Saved to **[Space Name]**?" with Confirm and Reassign buttons.
- Reassign opens a Space picker dropdown.

### 4.4 Global Search

- Search bar in top bar with `Cmd+K` shortcut.
- Results dropdown or dedicated results panel, grouped by Space and content type.
- Each result shows title (`--text-card`), snippet (`--text-body`), Space tag, and source meta.

### 4.5 Activity Log

Lives inside each Space View as an expandable panel.

- Feed of auto-categorization events: "**[Item title]** was added to this Space by AI."
- Each entry has **Accept** (checkmark, `--color-success`) and **Undo** (arrow, `--text-muted`) actions.
- Corrections refine future AI behavior — note this in the UI with a subtle helper text.

### 4.6 Sync Source Connection Flow

Inside Space Settings:

- Per-source OAuth connection (YouTube, Spotify, Reddit) — button triggers OAuth popup.
- RSS: text input for feed URL.
- After connecting: frequency picker (hourly / daily / weekly) + target Space selector.
- Status indicator: green dot (`--color-success`) for active, red dot (`--color-error`) for failed.

### 4.7 Collaborator Invite Flow

Inside Space Settings:

- Email input + "Invite" button.
- List of current collaborators with name, email, avatar, and role badge.
- Remove button per collaborator.

---

## 5. Interaction Patterns & States

### 5.1 Loading States

- **Card enrichment:** Skeleton shimmer on card fields (title, summary, thumbnail) while data is being pulled.
- **Sync pull:** Subtle progress indicator on the sync icon in the sidebar.
- **Page transitions:** Content area shows skeleton cards, sidebar remains stable.

### 5.2 Empty States

- **Library (no items):** Illustration + "Save your first bookmark" CTA + browser extension install nudge.
- **Space (no items):** "This Space is empty" + "Add a bookmark or connect a sync source" links.
- **Search (no results):** "No results for [query]" with suggestion to broaden the search.

### 5.3 Error States

- **Sync failure:** Red dot on source in Space Settings + error message (`--color-error`).
- **Save failure:** Toast with retry action.
- **Network error:** Banner at top of content area.

---

## 6. Responsive Behavior

- **Desktop (≥1024px):** Sidebar visible, content area fills remaining width.
- **Tablet (768–1023px):** Sidebar collapses to icon-only rail, expandable on tap.
- **Mobile (<768px):** Sidebar becomes a hamburger-triggered drawer. Cards stack in single column. Bookmark detail becomes a full-screen slide-up sheet instead of a side panel.

---

## 7. Build Order

Follow this sequence. Each step builds on the previous one.

| Step | What to Build                               | Key Dependencies                 |
| ---- | ------------------------------------------- | -------------------------------- |
| 1    | Auth pages (login, signup, forgot-password) | —                                |
| 2    | Sidebar + shell layout                      | Auth (logged-in state)           |
| 3    | Library page + Bookmark Card component      | Shell layout, card variants      |
| 4    | Space View                                  | Library (reuses card grid)       |
| 5    | Bookmark Detail panel (slide-over)          | Card component (opens from card) |
| 6    | Save/Add Item modal + enrichment loading    | Shell (triggered from top bar)   |
| 7    | All Spaces page                             | Space model                      |
| 8    | Space Settings (rules, collaborators, sync) | Space View                       |
| 9    | Global search                               | Library + card data              |
| 10   | Public share view (`/p/:shareToken`)        | Space View (read-only fork)      |
| 11   | Onboarding flow                             | Auth + Space creation            |
| 12   | User Settings                               | Auth                             |

---

## 8. Reference: CSS Custom Properties (Copy-Paste Starter)

```css
/* ── Brainfeed Design Tokens ── */

@import url("https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;1,500&family=DM+Sans:wght@400;500&display=swap");

:root {
  /* Sand ramp */
  --sand-parchment: #faf8f4;
  --sand-linen: #f0e9dc;
  --sand-sand: #e2d4c0;
  --sand-oat: #c8b49a;
  --sand-stone: #a8916e;
  --sand-bark: #7a6449;

  /* Terra ramp */
  --terra-50: #fdf0e8;
  --terra-100: #f9d8bc;
  --terra-200: #eeb990;
  --terra: #d4845a;
  --terra-600: #b5623a;
  --terra-walnut: #8b5e3c;

  /* Ink ramp */
  --ink-white: #faf8f4;
  --ink-fog: #edeae4;
  --ink-ash: #d0cdc6;
  --ink-smoke: #9a968f;
  --ink-slate: #6a6660;
  --ink: #1e1c1a;

  /* Light mode semantic tokens */
  --bg-base: var(--sand-parchment);
  --bg-surface: var(--sand-linen);
  --bg-raised: var(--sand-parchment);
  --border-subtle: var(--sand-sand);
  --border-strong: var(--sand-oat);
  --text-primary: var(--ink);
  --text-secondary: var(--ink-slate);
  --text-muted: var(--ink-smoke);
  --accent: var(--terra);
  --accent-subtle: var(--terra-50);
  --accent-text: var(--terra-600);

  /* Semantic */
  --color-success: #4a7a5b;
  --color-warning: var(--terra);
  --color-error: #c0392b;

  /* Typography */
  --font-display: "Lora", serif;
  --font-ui: "DM Sans", sans-serif;
}

[data-theme="dark"] {
  --bg-base: var(--ink);
  --bg-surface: #2a2725;
  --bg-raised: #36322f;
  --border-subtle: #3e3a36;
  --border-strong: var(--ink-slate);
  --text-primary: var(--sand-parchment);
  --text-secondary: var(--ink-fog);
  --text-muted: var(--ink-smoke);
  --accent: var(--terra);
  --accent-subtle: #3a2a20;
  --accent-text: var(--terra-200);
}

/* Type scale */
.text-display {
  font: 500 28px/1.2 var(--font-display);
}
.text-title {
  font: 500 20px/1.3 var(--font-display);
}
.text-card {
  font: 500 15px/1.35 var(--font-display);
}
.text-card-italic {
  font: italic 500 15px/1.35 var(--font-display);
}
.text-body {
  font: 400 14px/1.6 var(--font-ui);
}
.text-label {
  font: 500 11px var(--font-ui);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.text-meta {
  font: 400 11px var(--font-ui);
  color: var(--text-muted);
}
.text-tag {
  font: 500 10px var(--font-ui);
}
```
