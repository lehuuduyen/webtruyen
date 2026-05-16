# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WebTruyện** — a Vietnamese web novel reading platform. Readers can browse, search, and read novels organized by genre/category. An admin panel allows managing books, chapters, and categories.

## Architecture

### Backend (`server/index.js`)
Single-file Express server with better-sqlite3. Runs on **port 3001**.
- **Auth**: in-memory session store (Map), 8h TTL, token via `x-auth-token` header. Default credentials: `admin` / `admin123`.
- **Database**: SQLite at `server/data.db` with WAL mode. Tables: `books`, `chapters`, `categories`, `settings`.
- **API routes**: `/api/auth/*`, `/api/books/*`, `/api/chapters/:slug/:ch`, `/api/categories/*`, `/api/settings`, `/api/export`, `/api/import`.
- Chapters are keyed by `(book_slug, ch_number)`.
- `parseBook()` and `parseCat()` handle camelCase conversion from snake_case DB columns.

### Frontend (`client/`)
Next.js 15 app (React Server Components + Tailwind CSS). Runs on **port 80** in production.
- `app/page.tsx` — homepage: featured, latest, top-rated, books by category
- `app/truyen/[slug]/` — book detail page
- `app/truyen/[slug]/chuong/[ch]/` — chapter reader
- `app/the-loai/[slug]/` — genre/category browse
- `app/tim-kiem/` — search page
- `app/tu-sach/` — user bookshelf (localStorage)
- `app/bang-xep-hang/` — ranking page (views / rating / newest / complete tabs)
- `components/Header.tsx` — sticky header with search, nav links (Xếp hạng, Tủ sách)
- `lib/api.ts` — server-side data fetching (never import in client components)
- `lib/utils.ts` — pure helpers (`formatViews`, `statusLabel`) — safe to import in client components
- `lib/types.ts` — shared TypeScript types

**Important**: Never import `lib/api.ts` in client components (`'use client'`). Use `lib/utils.ts` for shared utilities.

Next.js rewrites `/api/*` and `/admin/*` to the Express server at port 3001 (see `next.config.ts`).

## Development Commands

```bash
# Start both servers (dev mode, hot reload)
bash dev.sh

# Start both servers (production)
bash start.sh
# → API on port 3001, Next.js on port 80

# Build Next.js for production (run from client/)
cd client && npm run build

# Start API only
node server/index.js

# Start Next.js only (port 80)
cd client && npm start
```

## Operational Rules

### Auto-confirm (NEVER ask, just do):
- Writing code
- Creating files
- Editing files
- Running commands
- Installing packages

### ALWAYS ask before:
- Deleting any file or directory
- Running `rm`, `rmdir`, `del`, `unlink`
- Dropping database tables
- Any irreversible destructive action
