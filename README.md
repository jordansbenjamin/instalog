# instalog

Turn the timesheet notes you already keep into Jira worklogs—without entering
the same day twice.

I built instalog around a simple habit: jot down ticket IDs and times as the day
unfolds, then deal with Jira later. Paste those notes into the app, check what it
understood, make any corrections, and send the whole day in one pass.

## Try it locally

You only need Node.js 20 or later to explore the complete workflow:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), select the Jira connection
control, and choose **Try the demo**. The demo uses simulated Jira responses, so
you do not need an account or environment variables.

Use **Load example** on the first step if you want to see the expected note
format immediately.

## What it does

- Parses a full day of plain-text notes line by line.
- Shows which lines are valid, skipped, or need attention as you type.
- Lets you review, edit, delete, and undo entries before anything reaches Jira.
- Submits worklogs individually and reports the result of each one.
- Retries only failed entries instead of sending successful work twice.
- Exports the completed run as CSV.
- Keeps in-progress work in local storage so a refresh does not erase your day.
- Keeps frequently used ticket IDs in a personal reference beside the wizard.
- Connects through Atlassian OAuth while keeping Jira tokens on the server.
- Includes an in-app feedback form for bug reports and suggestions.

## Keep common tickets close

The **Common tickets** panel is a small personal cheatsheet beside the wizard.
Select a ticket to copy its ID, then carry on with the notes you already keep.
It is deliberately separate from the worklog flow, so it remains useful even
when Jira is disconnected or you are trying the demo.

Use **Manage list** to add tickets, give them short labels, and put the ones you
reach for most at the top. If you already have a spreadsheet, choose **Import
list** and paste two columns:

```text
DEMO-42    Daily planning
TEAM-7     Team meeting
```

Tab-separated spreadsheet rows, two-column CSV, and Markdown Jira links are
accepted. The preview shows what will be added, updated, ignored, or needs
attention before it changes your draft.

The list stays in this browser. It is not sent to instalog's backend, added to
your Jira account, or synced to another device.

## Timesheet format

The first non-empty line is the date. Each worklog then uses:

```text
TICKET-ID START-END (optional description)
```

For example:

```text
16/3/26

PROJ-3278 8:40am-9:18am
CLIENT-77 9:18am-10am
MEET-1 10am-10:30am
DESIGN-13 10:37am-12:35pm
Lunch 12:35pm-1:15pm
ADMIN-269 2:38pm-3:04pm (Team messages)
DESIGN-13 3:28pm-3:50pm (Helping a teammate with review)
```

- Dates use `D/M/YY`.
- Times use a 12-hour clock: `9am`, `9:30am`, `12pm`, and so on.
- Descriptions are optional and go inside parentheses.
- Lines without a Jira-style ticket key—such as lunch—are shown as skipped
  rather than submitted.

## Connecting a real Jira account

The production path uses Atlassian OAuth 2.0 (3LO). The browser receives only an
`httpOnly` session cookie; access and refresh tokens are encrypted and stored by
the Express backend.

Local OAuth development needs:

- an Atlassian OAuth app;
- a MongoDB database;
- the values listed in `server/.env.example`.

Install the server dependencies and create its environment file:

```bash
npm --prefix server install
cp server/.env.example server/.env
```

Run the API and Vite app in separate terminals:

```bash
npm --prefix server run dev
```

```bash
npm run dev
```

Vite forwards `/api` requests from port `5173` to the Express server on port
`3000`, matching the same-origin API shape used in production.

## How the project is organised

```text
src/
├── domain/        # Pure parsing, validation, transformation, and formatting
├── state/         # Wizard and ticket-reference persistence
├── integration/   # Jira, connection, and feedback boundaries
├── hooks/         # Async UI orchestration
├── ui/            # Reusable design-system primitives
├── components/    # Wizard, ticket reference, layout, connection, and feedback UI
├── styles/        # Global styles and design tokens
└── types/         # Shared application contracts

server/src/
├── auth/          # Session and token-refresh rules
├── config/        # Validated environment configuration
├── crypto/        # Token encryption
├── jira-core/     # Atlassian OAuth and Jira API client
├── routes/        # Account, worklog, health, and feedback endpoints
└── store/         # MongoDB and in-memory persistence adapters
```

The parser and reducer form the tested core of the frontend. External systems
sit behind small interfaces, which lets the same wizard use either simulated
demo services or the real Jira backend.

## Useful commands

From the repository root:

```bash
npm run dev       # Start the Vite app
npm run test:run  # Run all frontend and server tests once
npm run lint      # Check the repository with ESLint
npm run build     # Type-check and build the production app
npm run preview   # Preview the production build
```

Server-only commands:

```bash
npm --prefix server run dev
npm --prefix server run typecheck
npm --prefix server run test:run
```

## Deployment

instalog is deployed as one Vercel project so the SPA and API share an origin:

- Vite builds the frontend as static assets.
- Express runs as a Vercel Function under `/api`.
- MongoDB stores users, encrypted OAuth tokens, and sessions.
- The browser never receives an Atlassian access or refresh token.

`vercel.json` sends `/api/*` to the serverless function and falls back to the SPA
for application routes. Production environment variables are documented in
`server/.env.example`.

## Releases

instalog uses milestone-based [Semantic Versioning](https://semver.org/):

- patches for fixes and small polish;
- minor versions for meaningful features;
- major versions for a substantial product reset or incompatible change.

Deployments do not automatically create releases. See [CHANGELOG.md](CHANGELOG.md)
for the human-readable history and [docs/RELEASING.md](docs/RELEASING.md) for the
maintainer checklist.

## Privacy

The app stores draft wizard state and your common-ticket reference in your
browser. For real Jira connections, the backend stores the account details and
encrypted tokens needed to maintain the session. The full policy is available
at `/privacy.html` in the running app.

## License

MIT
