# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

instalog turns plain-text timesheet notes into Jira worklogs through a 5-step wizard
(connect → paste → preview → submit → results). React 19 + TypeScript SPA at the repo root;
an Express 5 API under `server/` provides the Atlassian OAuth backend.

## Two projects, one repo

This folder holds **two separate npm packages**, each with its own `package.json`, `tsconfig`, and Vitest suite:

- **Root** — the Vite SPA (`src/`).
- **`server/`** — the Express API (`server/src/`).

The root `package.json` also lists `express`/`mongodb`/`cookie-parser` as dependencies. That is **not** a mistake to "clean up": Vercel's build needs them because `api/index.ts` imports the compiled server as the serverless entry point.

## Commands

Frontend (run from repo root):

```bash
npm run dev          # Vite dev server on :5173 (proxies /api → :3000)
npm run build        # tsc -b (type-check) THEN vite build — build fails on any type error
npm run test:run     # run the SPA suite once (Vitest, jsdom)
npm run test         # SPA tests in watch mode
npm run lint         # eslint .
npm run preview      # serve the production build
```

Backend (run from `server/`):

```bash
npm run dev          # tsx watch on :3000
npm run typecheck    # tsc --noEmit
npm run test:run     # run the server suite once
```

Run a single test file or test by name:

```bash
npm run test:run -- src/domain/parser.test.ts
npm run test:run -- -t "skips a Lunch line"
```

**Full local dev with the real backend** needs both processes running: `npm run dev` at the root and `npm run dev` in `server/`. The Vite proxy forwards `/api/*` to `:3000`, reproducing the production same-origin model. For pure UI work, demo mode needs neither the backend nor any config.

## Architecture

### Frontend layering (strict dependency direction)

```
domain/        pure timesheet→Jira logic: parser, transformer, format. No React. Fully unit-tested.
state/         useReducer state machine (reducer.ts) + localStorage persistence. Single source of truth.
integration/   two swappable seams behind interfaces; real + demo/fake impls each.
hooks/         async orchestration (useConnection, useSubmission) over the seams.
components/    app surfaces — layout, connection gate, the four wizard steps.
ui/            design-system primitives. Depend ONLY on CSS tokens; no app coupling (built to be extracted).
```

Keep the arrows pointing one way: `domain` knows nothing about React; `ui/` knows nothing about the app.

### The two seams (most important pattern)

External systems sit behind interfaces so they're swappable, selected at runtime by an `isDemo` flag:

- **`ConnectionService`** (`integration/connection/`) — `atlassianConnection` (real OAuth, full-page redirect) vs `demoConnection` (instant sample account). Because the real `connect()` *redirects* rather than resolving, connected state is rehydrated from the server session via `getCurrentAccount()` (`GET /api/me`) on load — see `useConnection`.
- **`JiraAdapter`** (`integration/jira/`) — `realJiraAdapter` vs `fakeJiraAdapter`, chosen at submit time by `connection.account.isDemo`.

The UI depends only on the interfaces, never the concrete implementations. When adding behaviour, extend the interface and both impls together.

### State machine

`src/state/reducer.ts` is a discriminated-union `useReducer` — the **single source of truth**, persisted whole to localStorage on every change (lazy-rehydrated on load). Notable, non-obvious invariants documented in the reducer:

- `RETRY_SUBMISSION` preserves `submissionResults` rather than filtering, so it stays index-aligned with entries; the submission loop re-posts only the non-ok slots and never double-logs a success.
- `RESET` keeps the connection (you shouldn't reconnect to log another day).
- The `default` case uses a `never` exhaustiveness check — add a case for every new action.

### Backend

- **`server/src/wiring.ts`** is the composition root: it wires `jira-core` + Mongo stores + token cipher into the API router, given a connected `Db`. Both runtime shells share it — the local long-lived server (`server/src/index.ts`) and the Vercel function (`server/src/serverlessApp.ts`).
- **Store contract** (`server/src/store/storeContract.ts`): one behavioural test suite is run against *both* the in-memory and Mongo store implementations, proving they're interchangeable behind the interface. When adding a store method, extend the contract, not just one impl.
- Atlassian tokens are stored **encrypted** in MongoDB; the session lives in an `httpOnly` cookie; the browser never sees a token. The Mongo client is cached at module scope so warm serverless invocations reuse the pool.

### Deployment model

Single Vercel project so SPA + API share one origin (first-party cookie, no CORS). `vercel.json` rewrites `/api/*` to the one function (`api/index.ts`); everything else falls back to the SPA's `index.html`.

## Gotchas

- **CSS Modules + global keyframes** (`vite.config.ts`): CSS Modules localises every class *and* every `@keyframes`/`animation` name. Names prefixed `il-` are deliberately kept **global** (they live in `src/styles/animations.css` and are shared across files); everything else is scoped. If you reference a global keyframe, prefix it `il-`, or the animation silently dies.
- **Real Jira submission from the browser is dev-only.** The `realJiraAdapter` path bundles credentials into the browser and is blocked by Jira's CORS policy when deployed. The deployable, multi-user path is the OAuth backend. Don't "fix" the frontend path for production.
- `tsconfig.app.json` has `noUnusedLocals`/`noUnusedParameters` on, and `build` runs `tsc -b` first — unused vars fail the build, not just lint.

## Testing

Vitest, tests colocated with source. The domain + state spine (parser, transformer, formatters, every reducer action) and the server (stores, auth, crypto, jira-core, routes) are covered. UI components, hooks, and the frontend integration layer are **not** yet covered — `@testing-library/*` is installed for future use but unused.

## Docs

- `docs/plans/phase8-oauth-backend.md` — the OAuth backend design + decisions.
- `docs/design_handoff_instalog/` — the design system source (tokens, component previews) that `src/ui/` and `src/styles/` are built from.
- `docs/css-learnings.md` — CSS notes worth reading before non-trivial styling work.
