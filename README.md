# Kids Typing

Kids Typing is a web app for teaching children how to type through progressive keyboard lessons. It is designed around short practice runs, gentle progression, and a typing screen inspired by Monkeytype.

## Stack

- `Next.js` App Router for the frontend and backend
- `React` for the practice interface
- local username/password authentication
- `SQLite` via `better-sqlite3`

## Current features

- local child accounts with cookie-based sessions
- eight levels that unlock in order
- home-row-first progression, then top row, bottom row, and sentences
- live typing metrics during a run
- per-level best WPM and accuracy tracking
- lesson progress stored locally in SQLite
- keyboard focus hints for each lesson

## Getting started

Requirements:

- Node.js 24+
- npm 10+

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

The SQLite database is created automatically at `data/kids-typing.sqlite`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Repository safety

This repository is intended to be public.

- local environment files such as `.env` and `.env.*` are ignored
- SQLite database files and local app data are ignored
- common key and certificate file types are ignored

If a secret is ever committed, `.gitignore` will not remove it from git history. It must be rotated and removed from history separately.

## Project structure

```text
app/          Next.js routes and server actions
components/   UI components
lib/          auth, database, levels, and progress logic
data/         local SQLite database files (ignored by git)
```

## Status

The app currently builds successfully and is ready for manual browser testing. Automated tests have not been added yet.

## Next steps

- parent dashboard for managing child accounts
- custom lesson editor
- badges, streaks, and kid-friendly rewards
- printable finger-placement guide
- Playwright end-to-end tests
