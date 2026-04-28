# instalog

A personal productivity tool for logging timesheet notes to Jira as worklogs. Paste your plain-text timesheet, preview the parsed entries, and submit them in one batch.

---

## Features

- Parses plain-text timesheets into structured entries
- Skips non-billable lines (LUNCH, MAKEUP) automatically
- Submits each entry as a Jira worklog with proper ADF-formatted comments
- Per-entry success/failure reporting with inline error messages
- Retry failed entries without resubmitting successful ones
- TBD

---

## Getting started

### Prerequisites

- Node.js 20 or later
- A Jira Cloud account with an API token ([how to create one](https://id.atlassian.com/manage-profile/security/api-tokens))

### Installation

```bash
git clone 
cd instalog
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in your Jira credentials:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description | Example |
|---|---|---|
| `VITE_JIRA_BASE_URL` | Your Jira Cloud instance URL | `https://yourcompany.atlassian.net` |
| `VITE_JIRA_EMAIL` | The email associated with your Jira account | `you@example.com` |
| `VITE_JIRA_API_TOKEN` | API token from Atlassian | `ATATT3xFfGF0T...` |

> **Security note:** these credentials are bundled into the browser build at compile time. This is fine for local personal use but not suitable for public deployment. See [Deployment](#deployment) for the production path.

### Running

```bash
npm run dev         # start dev server at http://localhost:5173
npm run test        # run tests in watch mode
npm run test:run    # run tests once (CI)
npm run lint        # lint
npm run build       # production build
npm run preview     # preview production build locally
```

---

## Timesheet format

Plain text, one entry per line, in the format `TICKET-ID START-END (optional description)`:

```text
16/3/26

C25-3278 8:40am-9:18am
CCT-77 9:18am-10am
OPS-1 10am-10:30am
FDES-13 10:37am-12:35pm
Lunch 12:35pm-1:15pm
CCT-77 1:15pm-2:38pm
OPS-269 2:38pm-3:04pm (slack)
FDES-13 3:28pm-3:50pm (Helping Vivian w/ Flinders)
```

- **Date** must appear as the first non-empty line, in `D/M/YY` format
- **Times** support `9am`, `9:30am`, `12pm`, etc. (12-hour format)
- **Descriptions** are optional, wrapped in parentheses
- **LUNCH** and **MAKEUP** entries are recognised and skipped

---

## Project structure

TBD

---

## Testing

Tests are colocated with the code they test (`parser.ts` and `parser.test.ts` in the same folder). The domain pipeline is fully covered; UI components use React Testing Library.

```bash
npm run test:run
```

---

## Deployment

Not currently deployed. For public deployment, the Jira credentials must move out of the browser bundle. The recommended path is a thin backend proxy (single serverless function) that holds credentials server-side and exposes a `POST /api/worklog` endpoint to the frontend. This is to be added.

---

## License

MIT

---

README v1.0