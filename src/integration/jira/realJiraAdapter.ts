import type { JiraAdapter } from "./JiraAdapter";
import type { JiraWorklog, SubmissionResult } from "../../types/shared";

// Posts each worklog to the backend (same-origin), which holds the Atlassian
// tokens server-side and talks to Jira. The browser never sees a token. The
// endpoint returns a SubmissionResult body (200) for ticket-level outcomes, and
// 401 when the session needs reconnecting — see server/src/routes/apiRouter.ts.
const WORKLOG_URL = "/api/jira/worklog";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export const realJiraAdapter: JiraAdapter = {
  async submit(worklog: JiraWorklog, signal?: AbortSignal): Promise<SubmissionResult> {
    let response: Response;
    try {
      response = await fetch(WORKLOG_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send the httpOnly session cookie
        body: JSON.stringify({ ticketId: worklog.ticketId, body: worklog.body }),
        signal,
      });
    } catch (error) {
      // Let an abort propagate so the submission loop bails instead of recording it.
      if (signal?.aborted || isAbortError(error)) {
        throw error;
      }
      return {
        ok: false,
        ticketId: worklog.ticketId,
        kind: "network",
        message: "Couldn't reach the server. Check your connection and try again.",
        retryable: true,
      };
    }

    if (response.status === 401) {
      return {
        ok: false,
        ticketId: worklog.ticketId,
        kind: "auth",
        message: "Your Jira session expired. Reconnect and try again.",
        retryable: false,
      };
    }

    if (!response.ok) {
      const isServer = response.status >= 500;
      return {
        ok: false,
        ticketId: worklog.ticketId,
        kind: isServer ? "server" : "unknown",
        status: response.status,
        message: `Unexpected server error (${response.status}).`,
        retryable: isServer,
      };
    }

    // 200 — the backend returns a SubmissionResult body verbatim (ok or ticket error).
    return (await response.json()) as SubmissionResult;
  },
};
