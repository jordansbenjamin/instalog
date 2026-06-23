import type { JiraAdapter } from "./JiraAdapter";
import type { SubmissionErrorKind } from "../../types/shared";
import { abortableDelay } from "../../lib/abortableDelay";

// Demo failures keyed by ticket. These match the sample timesheet so the demo
// always shows a realistic success/failure mix (and exercises the retry flow in
// Results). PLAT-318 is the typo the paste suggestion fixes — change it to
// PLAT-381 and it succeeds, which is the point of the "fix then retry" narrative.
const DEMO_FAILURES: Record<string, { status: number; kind: SubmissionErrorKind; message: string }> = {
  "ACME-4126": {
    status: 403,
    kind: "permission",
    message: "You're not a contributor on this issue yet. Ask the project lead to add you, then retry.",
  },
  "PLAT-318": {
    status: 404,
    kind: "not-found",
    message: "Issue PLAT-318 doesn't exist in Jira. Did you mean PLAT-381?",
  },
};

// Per-entry latency window — staggered, not batched, so it reads like real
// network calls rather than a fake loader.
const MIN_LATENCY_MS = 260;
const LATENCY_JITTER_MS = 220;

function retryable(kind: SubmissionErrorKind): boolean {
  return kind === "server" || kind === "network";
}

export const fakeJiraAdapter: JiraAdapter = {
  async submit(worklog, signal) {
    await abortableDelay(MIN_LATENCY_MS + Math.random() * LATENCY_JITTER_MS, signal);

    const failure = DEMO_FAILURES[worklog.ticketId];
    if (failure) {
      return {
        ok: false,
        ticketId: worklog.ticketId,
        kind: failure.kind,
        status: failure.status,
        message: failure.message,
        retryable: retryable(failure.kind),
      };
    }

    return { ok: true, ticketId: worklog.ticketId, worklogId: `demo-${worklog.ticketId}` };
  },
};
