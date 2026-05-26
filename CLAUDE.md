# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WebTruyện** — a Vietnamese web novel reading platform. Readers can browse, search, and read novels organized by genre/category. An admin panel allows managing books, chapters, and categories.

## Architecture

### Backend (`server/index.js`)
Single-file Express server with better-sqlite3. Runs on **port 3001**.
- **Auth**: in-memory session store (Map), 8h TTL, token via `x-auth-token` header. Default credentials: `admin` / `admin123`. Credentials are stored hashed in the `settings` table (keys `admin_user`, `admin_pass`).
- **Database**: SQLite at `server/data.db` with WAL mode. Tables: `books`, `chapters`, `categories`, `settings`.
- **API routes**: `/api/auth/*`, `/api/books/*`, `/api/chapters/:slug/:ch`, `/api/categories/*`, `/api/settings`, `/api/export`, `/api/import`, `/api/clear`, `/api/seed`.
- Chapters are keyed by `(book_slug, ch_number)` with a UNIQUE constraint; upsert is used for create/update.
- `parseBook()` and `parseCat()` handle camelCase conversion from snake_case DB columns.
- The `public/` directory at repo root is served as Express static files.
- CORS is restricted to `http://localhost:3000` and `SITE_URL` env var.

### Frontend (`client/`)
Next.js 15 app (React Server Components + Tailwind CSS).
- `app/page.tsx` — homepage: featured, latest, top-rated, books by category
- `app/truyen/[slug]/` — book detail page
- `app/truyen/[slug]/chuong/[ch]/` — chapter reader
- `app/the-loai/[slug]/` — genre/category browse
- `app/tim-kiem/` — search page
- `app/tu-sach/` — user bookshelf (localStorage)
- `app/bang-xep-hang/` — ranking page (views / rating / newest / complete tabs)
- `components/Header.tsx` — sticky header with search, nav links
- `lib/api.ts` — server-side data fetching with 5-minute ISR cache (`revalidate: 300`). **Never import in client components.**
- `lib/utils.ts` — pure helpers (`formatViews`, `statusLabel`) — safe in both server and client components
- `lib/types.ts` — shared TypeScript types

Next.js rewrites `/api/*` and `/admin/*` to the Express server at port 3001 (see `next.config.ts`). The admin panel UI is served directly by Express, not Next.js.

### Environment Variables
- `API_URL` — internal URL of the Express server (default: `http://localhost:3001`). Used by `next.config.ts` and `lib/api.ts`.
- `SITE_URL` — allowed CORS origin for the Express server (e.g. `https://yourdomain.com`).
- `PORT` — Next.js port override (default: 3000 for dev, 80 for production start).

## Deployment

Production runs behind **nginx on port 80**. nginx proxies to:
- Next.js (port 3000 or 80 depending on config)
- Express API (port 3001)

## Development Commands

```bash
# Start both servers (dev mode, hot reload — Next.js on port 3000, API on port 3001)
bash dev.sh

# Start both servers (production — Next.js on port 80, API on port 3001)
bash start.sh

# Build Next.js for production
cd client && npm run build

# Start API only
node server/index.js

# Lint Next.js
cd client && npm run lint
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
