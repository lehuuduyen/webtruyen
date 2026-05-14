# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WebTruyện** — a Vietnamese web novel reading platform. Readers can browse, search, and read novels organized by genre/category. An admin panel allows managing books, chapters, and categories.

## Development Commands

```bash
# Start the API server (from server/ directory)
cd server && node index.js

# Install server dependencies
cd server && npm install
```

The server runs on **port 3001**. In production, nginx serves `public/` as static files on port 80 and reverse-proxies `/api/*` to `:3001`.

No build step — all frontend files are plain HTML/CSS/JS served directly.

## Architecture

### Backend (`server/index.js`)
Single-file Express 5 server with better-sqlite3. All logic lives in one file:
- **Auth**: in-memory session store (Map), 8h TTL, token via `x-auth-token` header. Default credentials: `admin` / `admin123`.
- **Database**: SQLite at `server/data.db` with WAL mode. Tables: `books`, `chapters`, `categories`, `settings`.
- **API routes**: `/api/auth/*`, `/api/books/*`, `/api/chapters/:slug/:ch`, `/api/categories/*`, `/api/settings`, `/api/export`, `/api/import`.
- Chapters are keyed by `(book_slug, ch_number)` — the `book_slug` field (not book ID) is the foreign key throughout.
- `parseBook()` and `parseCat()` handle camelCase conversion from snake_case DB columns.

### Frontend (`public/`)
Static pages, each with a dedicated JS and CSS file in `assets/`:
- `index.html` + `assets/js/main.js` — homepage: reading history, dynamic category sections, featured grid, ranking sidebar, suggestions
- `book.html` + `assets/js/book.js` — book detail with chapter list
- `doc.html` + `assets/js/doc.js` — chapter reader
- `genre.html` + `assets/js/genre.js` — browse by genre/category
- `profile.html` + `assets/js/profile.js` — user bookshelf (reading history stored in localStorage)
- `admin/` — login + dashboard SPA; `admin.js` handles all CRUD via `x-auth-token` session token stored in `sessionStorage`
- `assets/js/api.js` — shared API helper; `assets/js/similar.js` — recommendations

Reading history and bookshelf are **localStorage-only** (no user accounts for readers).

## Operational Rules

### Auto-confirm (NEVER ask, just do):
- Writing code
- Creating files
- Editing files
- Running commands
- Installing packages
- Making API calls

### ALWAYS ask before:
- Deleting any file or directory
- Running `rm`, `rmdir`, `del`, `unlink`
- Dropping database tables
- Any irreversible destructive action
