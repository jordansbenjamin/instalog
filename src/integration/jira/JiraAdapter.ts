import type { JiraWorklog, SubmissionResult } from "../../types/shared";

// ── Seam 2: the submission port ──────────────────────────────────────────
// The submission orchestration depends only on this interface. Two
// implementations slot in behind it — `realJiraAdapter` (wraps the typed
// postWorklog client) and `fakeJiraAdapter` (demo). Which one is used is
// selected at submit time by `connection.account.isDemo`, exactly mirroring
// Seam 1 (ConnectionService: simulated vs demo).
export interface JiraAdapter {
  // `signal` lets a caller abort an in-flight submission. Honoured by the fake
  // adapter's delay; the real adapter discards an aborted result at the
  // orchestration layer (postWorklog doesn't yet thread a signal to fetch).
  submit(worklog: JiraWorklog, signal?: AbortSignal): Promise<SubmissionResult>;
}
