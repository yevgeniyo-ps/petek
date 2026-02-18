# Petek - Markdown Notes App (Google Keep-like)

## Overview

A Google Keep-inspired notes app with full **Markdown support**, hosted on **GitHub Pages** (static SPA), powered by **Supabase** for database and auth. Each user's data is fully isolated using Row Level Security (RLS). **Minimalistic dark-theme-only** design.

**Auth strategy:** Start with **email/password** auth (Phase 1), then add **Google + Apple OAuth** (Phase 2).

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              GitHub Pages (Static Host)          │
│  ┌───────────────────────────────────────────┐   │
│  │         React SPA (Vite build)            │   │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────┐  │   │
│  │  │ Auth UI │ │ Note     │ │ Markdown  │  │   │
│  │  │(Email)  │ │ Board    │ │ Editor    │  │   │
│  │  └────┬────┘ └────┬─────┘ └─────┬─────┘  │   │
│  │       │           │              │        │   │
│  │  ┌────▼───────────▼──────────────▼─────┐  │   │
│  │  │        Supabase JS Client           │  │   │
│  │  └────────────────┬────────────────────┘  │   │
│  └───────────────────┼───────────────────────┘   │
└──────────────────────┼───────────────────────────┘
                       │ HTTPS
┌──────────────────────▼───────────────────────────┐
│                 Supabase Cloud                    │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Auth       │  │   PostgreSQL Database     │  │
│  │(Email/Pass)  │  │   (RLS per user)          │  │
│  └──────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer          | Technology                        | Reason                                        |
| -------------- | --------------------------------- | --------------------------------------------- |
| Framework      | **React 19** + **TypeScript**     | Mature ecosystem, strong typing               |
| Build          | **Vite**                          | Fast builds, native GitHub Pages support       |
| Styling        | **Tailwind CSS v4**               | Utility-first, rapid UI development            |
| Markdown Edit  | **@uiw/react-md-editor**         | Full-featured MD editor with preview           |
| Markdown Render| **react-markdown** + **remark-gfm** | Render MD in card previews (GFM tables, etc) |
| Auth + DB      | **Supabase JS v2** (`@supabase/supabase-js`) | Auth, Postgres, RLS, real-time    |
| Routing        | **React Router v7**               | SPA routing with hash router (GH Pages)       |
| State          | **React Context + useReducer**    | Simple, no extra deps needed                   |
| DnD            | **@dnd-kit/core**                 | Lightweight drag-and-drop for note reordering  |
| Icons          | **lucide-react**                  | Clean, consistent icon set                     |
| Deploy         | **GitHub Actions**                | Auto-deploy to GitHub Pages on push            |

---

## Design System (Dark Minimalist)

### Color Palette

| Token               | Value       | Usage                              |
| -------------------- | ----------- | ---------------------------------- |
| `--bg-primary`       | `#0a0a0a`  | Page background                    |
| `--bg-secondary`     | `#141414`  | Card/surface background            |
| `--bg-tertiary`      | `#1e1e1e`  | Sidebar, elevated surfaces         |
| `--border`           | `#2a2a2a`  | Borders, dividers                  |
| `--border-hover`     | `#3a3a3a`  | Borders on hover                   |
| `--text-primary`     | `#e5e5e5`  | Primary text                       |
| `--text-secondary`   | `#a3a3a3`  | Secondary/muted text               |
| `--text-tertiary`    | `#666666`  | Placeholder text                   |
| `--accent`           | `#3b82f6`  | Primary accent (blue-500)          |
| `--accent-hover`     | `#2563eb`  | Accent hover state                 |
| `--danger`           | `#ef4444`  | Delete/error actions               |

### Note Colors (muted dark variants)

| Name       | Background | Border     |
| ---------- | ---------- | ---------- |
| Default    | `#141414`  | `#2a2a2a`  |
| Coral      | `#2a1515`  | `#3d2020`  |
| Peach      | `#2a1f10`  | `#3d2d18`  |
| Sand       | `#2a2810`  | `#3d3818`  |
| Mint       | `#0f2a1a`  | `#183d25`  |
| Sage       | `#0f2a28`  | `#183d38`  |
| Sky        | `#0f1a2a`  | `#18253d`  |
| Lavender   | `#1f0f2a`  | `#2d183d`  |
| Rose       | `#2a0f20`  | `#3d182d`  |

### Design Principles
- **No light mode** — dark theme only
- **Minimal chrome** — thin 1px borders, no shadows, no gradients
- **Lots of breathing room** — generous padding, whitespace is a feature
- **Monochrome + one accent** — neutral grays with blue accent for interactive elements
- **Subtle hover states** — slight border/background shifts, no dramatic transitions
- **Typography** — system font stack (`Inter` if loaded, else system sans-serif), limited sizes (14px body, 13px small, 16px headings)

---

## Supabase Setup (Manual Steps Before Coding)

### 1. Create Supabase Project
- Go to https://supabase.com and create a new project
- Note the **Project URL** and **Anon Key** (these go in `.env`)

### 2. Enable Email Auth (default)
- Supabase has email/password auth enabled by default
- Optionally disable email confirmation for dev (Auth > Settings > toggle off)

### 3. Configure Auth Settings
- Set **Site URL**: `https://<username>.github.io/petek`
- Add redirect URLs: `https://<username>.github.io/petek/**`

---

## Database Schema

### Table: `notes`

| Column         | Type          | Default            | Description                     |
| -------------- | ------------- | ------------------ | ------------------------------- |
| `id`           | `uuid`        | `gen_random_uuid()`| Primary key                     |
| `user_id`      | `uuid`        | `auth.uid()`       | Owner (FK to auth.users)        |
| `title`        | `text`        | `''`               | Note title                      |
| `content`      | `text`        | `''`               | Markdown content                |
| `color`        | `text`        | `'default'`        | Note color theme                |
| `is_pinned`    | `boolean`     | `false`            | Pinned to top                   |
| `is_archived`  | `boolean`     | `false`            | Archived (hidden from main)     |
| `is_trashed`   | `boolean`     | `false`            | In trash (soft delete)          |
| `position`     | `integer`     | `0`                | Sort order for drag-and-drop    |
| `created_at`   | `timestamptz` | `now()`            | Creation timestamp              |
| `updated_at`   | `timestamptz` | `now()`            | Last modified timestamp         |

### Table: `labels`

| Column         | Type          | Default            | Description                     |
| -------------- | ------------- | ------------------ | ------------------------------- |
| `id`           | `uuid`        | `gen_random_uuid()`| Primary key                     |
| `user_id`      | `uuid`        | `auth.uid()`       | Owner                           |
| `name`         | `text`        | —                  | Label name                      |
| `created_at`   | `timestamptz` | `now()`            | Creation timestamp              |

**Unique constraint:** `(user_id, name)`

### Table: `note_labels` (junction)

| Column         | Type          | Description                     |
| -------------- | ------------- | ------------------------------- |
| `note_id`      | `uuid`        | FK to notes.id (CASCADE delete) |
| `label_id`     | `uuid`        | FK to labels.id (CASCADE delete)|

**Primary key:** `(note_id, label_id)`

### Row Level Security (RLS)

```sql
-- NOTES
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

-- LABELS
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own labels" ON labels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own labels" ON labels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own labels" ON labels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own labels" ON labels FOR DELETE USING (auth.uid() = user_id);

-- NOTE_LABELS
ALTER TABLE note_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own note_labels" ON note_labels FOR SELECT
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can insert own note_labels" ON note_labels FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can delete own note_labels" ON note_labels FOR DELETE
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_id AND notes.user_id = auth.uid()));
```

### Auto-update `updated_at` trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Project Structure

```
petek/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                 # Tailwind + CSS custom properties (dark theme)
│   ├── config/
│   │   └── supabase.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── NotesContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useNotes.ts
│   │   └── useLabels.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── notes/
│   │   │   ├── NoteCard.tsx
│   │   │   ├── NoteBoard.tsx
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── NoteInput.tsx
│   │   │   ├── NoteToolbar.tsx
│   │   │   └── NoteSearch.tsx
│   │   ├── labels/
│   │   │   ├── LabelManager.tsx
│   │   │   └── LabelPicker.tsx
│   │   └── ui/
│   │       ├── Modal.tsx
│   │       ├── ColorPicker.tsx
│   │       └── ConfirmDialog.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ArchivePage.tsx
│   │   ├── TrashPage.tsx
│   │   └── LabelPage.tsx
│   ├── types/
│   │   └── index.ts
│   └── lib/
│       ├── notes.ts
│       ├── labels.ts
│       └── utils.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── plan.md
```

---

## Features by Phase

### Phase 1 - MVP (email/password auth + core notes)
1. Email/password sign-up & sign-in via Supabase Auth
2. Create notes with title + markdown content
3. View notes in responsive card grid with markdown preview
4. Edit notes with full markdown editor (side-by-side preview)
5. Delete notes (soft delete to trash)
6. Pin notes to top
7. Color-code notes (9 dark-themed colors)
8. Search notes by title/content
9. Responsive dark minimalist layout
10. GitHub Pages deployment via GitHub Actions

### Phase 2 - OAuth + Organization
11. Add **Google OAuth** sign-in
12. Add **Apple OAuth** sign-in
13. Labels - create, assign to notes, filter by label
14. Archive notes
15. Trash with auto-purge (7 days)
16. Grid/List view toggle

### Phase 3 - Polish
17. Drag-and-drop reordering
18. Keyboard shortcuts (N = new note, / = search, etc.)
19. Offline indicator

---

## GitHub Pages Deployment

Use **HashRouter** for SPA routing on GitHub Pages.

### GitHub Actions workflow
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

---

## Implementation Order (Phase 1)

### Step 1: Project Scaffolding
- Init Vite + React + TypeScript
- Install dependencies
- Configure Tailwind CSS with dark theme custom properties
- Set up `vite.config.ts` (`base: '/petek/'`)
- Create `.env.example`

### Step 2: Supabase Foundation
- Create `supabase/migrations/001_initial_schema.sql`
- Create `src/config/supabase.ts`
- Create `src/types/index.ts`

### Step 3: Authentication (Email/Password)
- Create `AuthContext.tsx` — session state, onAuthStateChange
- Create `LoginPage.tsx` — minimal dark sign-in/sign-up form
- Create `AuthGuard.tsx` — redirect unauthenticated to login

### Step 4: Notes CRUD + Markdown
- Create `src/lib/notes.ts` — Supabase query functions
- Create `NotesContext.tsx` — notes state management
- Build `NoteInput.tsx` — "Take a note..." input bar
- Build `NoteEditor.tsx` — markdown editor modal
- Build `NoteCard.tsx` — card with markdown preview
- Build `NoteBoard.tsx` — responsive grid

### Step 5: Core UI & Features
- Build `Layout.tsx`, `Header.tsx`, `Sidebar.tsx`
- Build `HomePage.tsx` — pinned + others sections
- Wire up pin, color picker, delete actions
- Add search bar with client-side filtering
- Build `TrashPage.tsx`

### Step 6: Deploy
- Create `.github/workflows/deploy.yml`
- Test locally with `npm run dev`
- Push and verify GitHub Pages deployment

---

## Security Notes

- **Supabase Anon Key is public** — RLS policies protect data
- **RLS is the security boundary** — every table enforces `auth.uid() = user_id`
- **Never expose service_role key** in frontend
- Passwords handled entirely by Supabase

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```
