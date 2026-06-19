# instalog

Turn the plain-text timesheet notes you already keep into Jira worklogs — paste a day, watch it
parse line-by-line, preview and tweak the entries, and submit them in one motion.

A React + TypeScript single-page app. The timesheet→Jira domain logic, the wizard state machine,
and a small design system are all built and working; real multi-user Atlassian OAuth is the next
piece of work (see [Status](#status)).

---

## Status

- ✅ **Full wizard UI** — connect → paste → preview → submit → results, with a live highlighting
  editor, inline edit/delete/undo, a live submission log, retry of only-failed entries, and CSV export.
- ✅ **Domain spine** — parser, transformer, formatters, and the reducer state machine, all unit-tested
  (73 tests).
- ✅ **Demo mode** — explore the whole flow with simulated data, no Jira account needed.
- ⚠️ **Real Jira submission** — the code exists (`postWorklog`, Basic auth) but is **dev-only**: it
  bundles credentials into the browser and is blocked by Jira's CORS policy when deployed. Use demo
  mode, or run locally with your own `.env`.
- 🔭 **Multi-user Atlassian OAuth backend** — designed, not yet built. See
  `docs/plans/phase8-oauth-backend.md`.

---

## Features

- Live, line-by-line timesheet parsing with a gutter (✓ valid / ⏵ skipped / ! error / ◆ date)
- Syntax-highlighted paste editor with a custom tokenizer
- Preview with 4-up metrics, inline note editing, delete + 5-second undo
- Per-entry submission with a live log and an abortable request loop
- Per-entry success/failure with inline error messages; retry re-posts **only** failures
- CSV export of the run; connection gate with a demo mode
- localStorage persistence (your place in the flow survives a refresh)

---

## Getting started

### Prerequisites

- Node.js 20 or later
- (Optional, for real submission in local dev) a Jira Cloud account with an API token
  ([how to create one](https://id.atlassian.com/manage-profile/security/api-tokens))

### Installation

```bash
npm install
npm run dev          # http://localhost:5173
```

You can explore everything in **demo mode** without any configuration.

### Configuration (optional — local real submission only)

Copy `.env.example` to `.env` and fill in your Jira credentials:

| Variable | Description | Example |
|---|---|---|
| `VITE_JIRA_BASE_URL` | Your Jira Cloud REST base URL | `https://yourcompany.atlassian.net/rest/api/3` |
| `VITE_JIRA_EMAIL` | The email on your Jira account | `you@example.com` |
| `VITE_JIRA_API_TOKEN` | API token from Atlassian | `ATATT3xFfGF0T...` |

> **Security note:** these are compiled into the browser bundle, so this path is for **local
> personal use only** — never deploy it. Real, deployable, multi-user submission is the job of the
> OAuth backend (see the design doc in `docs/plans/`).

### Scripts

```bash
npm run dev          # dev server
npm run test:run     # run the test suite once
npm run test         # tests in watch mode
npm run lint         # eslint
npm run build        # type-check + production build
npm run preview      # preview the production build
```

---

## Timesheet format

Plain text, one entry per line, as `TICKET-ID START-END (optional description)`. The first
non-empty line is the date, in `D/M/YY`:

```text
16/3/26

C25-3278 8:40am-9:18am
CCT-77 9:18am-10am
OPS-1 10am-10:30am
FDES-13 10:37am-12:35pm
Lunch 12:35pm-1:15pm
OPS-269 2:38pm-3:04pm (slack)
FDES-13 3:28pm-3:50pm (Helping Vivian w/ Flinders)
```

- **Date** — first non-empty line, `D/M/YY` (2-digit year, assumed 2000s).
- **Times** — 12-hour: `9am`, `9:30am`, `12pm`, etc.
- **Descriptions** — optional, in parentheses.
- **Anything that isn't a ticket key** (e.g. `Lunch …`) is treated as a skipped line, even if it
  has a time range.

---

## Project structure

```text
src/
├── domain/        # pure timesheet→Jira logic: parser, transformer, formatters (the tested spine)
├── state/         # useReducer state machine + localStorage persistence
├── integration/   # Jira client + two swappable seams (connection, submission); demo + real impls
├── hooks/         # async orchestration (connection flow, submission loop)
├── ui/            # design-system primitives (depend only on CSS tokens; no app coupling)
├── components/    # app surfaces: layout, connection gate, and the four wizard steps
├── styles/        # global tokens, shared keyframes, base reset
└── types/         # cross-cutting domain + view types
```

A fuller, audited breakdown lives in `docs/instalog-snapshot.md`.

---

## Architecture notes

- **Two interface seams** keep external systems swappable: `ConnectionService` (simulated / demo /
  — later — real OAuth) and `JiraAdapter` (real / fake), selected at runtime by an `isDemo` flag.
  The UI depends only on the interfaces.
- **The parser is the brain** — it emits per-line classification + highlight tokens; the editor is a
  pure view over them.
- **`src/ui/` is built to be extracted** as a standalone design system when instalog becomes a
  feature in a larger app.

---

## Testing

Vitest (jsdom environment), tests colocated with the code. **73 tests** cover the domain + state
spine — parser, transformer, formatters, and every reducer action. UI components, hooks, and the
integration layer are **not** yet covered. (`@testing-library/*` is installed for future component
tests but isn't used yet.)

```bash
npm run test:run
```

---

## Deployment

Deployed as a **single Vercel project** so the SPA and API share one origin — the `httpOnly`
session cookie stays first-party and there's no CORS:

- The **Vite SPA** is built and served statically from Vercel's CDN.
- The **Express API** (`server/`) runs as one **Vercel Function** at `api/index.ts`, handling
  `/api/*`. It holds the Atlassian OAuth client secret server-side, stores each user's tokens
  **encrypted** in MongoDB Atlas, and keeps the session in an `httpOnly` cookie. The browser never
  sees a token. The Mongo client is cached at module scope so warm invocations reuse the pool.
- `vercel.json` routes `/api/*` to the function; all other paths fall back to the SPA.

To deploy: set the server env vars (see [server/.env.example](server/.env.example)) in the Vercel
project settings, and register the Atlassian callback URL as
`https://<your-app>.vercel.app/api/jira/callback`.

Design + decisions: `docs/plans/phase8-oauth-backend.md`.

---

## License

MIT
