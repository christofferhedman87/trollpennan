# Copilot instructions for Trollpennan

This repository contains Trollpennan, a Swedish word-building game for children. The project is a full codebase archive with both active application code and historical recovery documentation. The active app code is primarily under `src/`, while `recovery/`, `referens/`, `verification/`, and various `RUNDA*` / `PLAN*` files capture design history, validation, and recovery context.

## What this project is

- Purpose: educational word-building game with a child-friendly UI and Swedish language gameplay
- Stack: TypeScript, React, Vite, TanStack Router, Tailwind-style styling, and local browser-based persistence
- Delivery status: the repository contains a checkpoint / production-oriented static build setup; see `README.md`, `HANDOFF.md`, `BLOCK-STATUS.md`, and `RELEASE-REPORT.md`
- Important constraint: the project is intended to run as a static pages build with local storage and without external tracking/services

## Read these files first

When a new agent starts here, these are the default “start here” documents:

- `README.md` — short project status and build summary
- `HANDOFF.md` — primary handoff summary and likely the most important context file
- `BLOCK-STATUS.md` — current blockers / status notes
- `RELEASE-REPORT.md` — verification and release notes
- `AGENTS.md` — project-specific rules and guardrails
- `PROJECT.md` — project intent and architecture notes
- `projektregler.md` — implementation rules and constraints
- `recovery/pre-cloudflare/README.md` — historical recovery and archive context

## Repository map

### Root docs and project planning

- `README.md` — repo summary and current checkpoint status
- `AGENTS.md` — coding and workflow instructions for agents
- `PROJECT.md` — product/project overview
- `HANDOFF.md` — handoff notes for continuing work
- `BLOCK-STATUS.md` — status / blocked items
- `RELEASE-REPORT.md` — release validation / QA notes
- `CHANGELOG.md`, `IMPROVEMENT-LOG.md` — change history
- `PLAN-G1a.md`, `PLAN-G1b.md`, `PLAN-G1c.md` — planning docs
- `RUNDA*.md`, `RUNDAR*.md`, `RUNDAG1.md`, `RUNDAC*.md` — round / gameplay / design notes

### App source

- `src/` — active application code
  - `src/routes/` — route definitions and route-level pages
  - `src/spel/` — core gameplay logic, game orchestration, scenes, and UI related to the word game itself
  - `src/tolk/` — language parsing, game logic, validation, and associated tests
  - `src/lib/` — shared logic, app data, auth, readiness, and utilities
  - `src/components/` — reusable UI components
  - `src/persist/` — persistence/storage layer
  - `src/styles.css` — global styling and theming
  - `src/pages-main.tsx` and `src/router.tsx` — app entry and routing setup
  - `src/routeTree.gen.ts` — generated route tree for TanStack Router

### Data, assets, and static content

- `data/` — static game data and structured content
- `public/` — static assets served by Vite
- `rundor/` — round content or gameplay round materials
- `referens/` — reference materials and historical notes
- `docs/` — documentation and generated material

### Backend / runtime / tooling

- `server/` — server-side logic and runtime support
- `scripts/` — build checks, validation scripts, migration scripts, and project automation
- `migrations/` — schema or data migration files
- `verification/` — verification artifacts and checks
- `startup.sh` — startup helper script
- `vite.config.ts`, `vite.pages.config.ts`, `tsconfig.json`, `tsconfig.pages.json` — Vite and TypeScript config
- `package.json` — scripts and dependencies
- `wrangler.jsonc`, `vercel.json` — deployment-related config

### Recovery and historical archive

- `recovery/` — preserved historical project or original environment copy
- `recovery/pre-cloudflare/README.md` — important notes about recovered historical files
- `recovery/ARCHITECTURE.md` and similar files — architecture context for recovered implementation
- `LICENSES.md`, `CREDITS.md` — legal and attribution information

## Production / build workflow

Use the repository scripts from `package.json`:

- Install dependencies: `npm ci`
- Type-check app: `npm run typecheck`
- Type-check static pages build: `npm run typecheck:pages`
- Run product tests: `npm run test:product`
- Build static pages: `npm run build:pages`
- Validate output: `npm run check:pages-output`
- Start preview: `npm run preview:pages`

The repository also includes project-specific validation commands:

- `npm run check:struktur`
- `npm run check:auth`
- `npm run lint`
- `npm run test`

## Architecture notes

- The app is built as a modern TypeScript frontend with Vite and React.
- The gameplay logic is concentrated in `src/spel/` and `src/tolk/`.
- The repo contains a static pages-focused production path (`build:pages`, `preview:pages`, `check:pages-output`) that is likely the intended external-facing artifact.
- Local storage is preferred; avoid introducing external services or tracking into the app unless explicitly requested.
- There is preserved historical and recovered platform code in `recovery/` and related folders; do not assume it is active unless it is in the active `src/` tree or called out in project docs.

## Working rules for Copilot

- Prefer the smallest, most focused fix.
- Keep the project’s gameplay rules and Swedish language logic consistent.
- When a change affects game behavior, verify the relevant tests or docs before merging.
- Do not remove historical or recovery material without explicit reason.
- Do not treat recovered legacy code as the active implementation unless the docs say it is.
- If a feature or bug is unclear, use the handoff docs and project rules before inventing a new architecture.

## Good starting questions to answer

- Which files are the actual active gameplay engine vs. historical references?
- Is the change intended for the Vite app or the static pages build?
- Does this impact the game logic in `src/spel/` or the language logic in `src/tolk/`?
- Are there relevant verification scripts for the behavior being changed?

## Short version

If you are continuing work, start with `README.md` + `HANDOFF.md` + `AGENTS.md`, then inspect `src/spel/`, `src/tolk/`, and the relevant scripts in `scripts/`. Treat `recovery/` as historical context, not the default active code path.

This repository is a Swedish educational word game archive and build system, not a generic app starter.

---

This file exists to help other Copilot sessions orient quickly and avoid wandering through historical, legal, and design artifacts before reaching the active implementation.
