import type { JiraWorklog, SubmissionErrorKind, SubmissionResult } from "../types/shared";

function classifyStatus(status: number): SubmissionErrorKind {
  if (status === 401) return 'auth';
  if (status === 403) return 'permission';
  if (status === 404) return 'not-found';
  if (status >= 500) return 'server';
  return 'unknown';
}

function isRetryable(kind: SubmissionErrorKind): boolean {
  return kind === 'server' || kind === 'network';
}

function buildErrorMessage(kind: SubmissionErrorKind, status: number, body: string): string {
  switch (kind) {
    case 'auth':
      return 'Your Jira credentials were rejected. Check your API token.'
    case 'permission':
      return "You don't have permission to log work on this issue."
    case 'not-found':
      return "This ticket doesn't exist in Jira. Check the ticket ID."
    case 'server':
      return `Jira is having trouble (${status}). Try again in a moment.`
    case 'unknown':
      // return `Unexpected error (${status}): ${body.slice(0, 200)}`
      return `Unexpected error (${status}): ${body}`
    default:
      // return body.slice(0, 200)
      return body;
  }
}

export async function postWorklog(worklogEntry: JiraWorklog): Promise<SubmissionResult> {
  const baseUrl = import.meta.env.VITE_JIRA_BASE_URL;
  const username = import.meta.env.VITE_JIRA_EMAIL;
  const password = import.meta.env.VITE_JIRA_API_TOKEN;
  
  if (!baseUrl || !username || !password) {
    return {
      ok: false,
      ticketId: worklogEntry.ticketId,
      kind: 'config',
      message: "Jira credentials are not configured. Check your .env file",
      retryable: false,
    }
  }

  const url = `${baseUrl}/issue/${worklogEntry.ticketId}/worklog`;
  const auth = btoa(`${username}:${password}`);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${auth}`,
        "X-Atlassian-Token": "no-check",
      },
      body: JSON.stringify(worklogEntry.body)
    });
  } catch(error) {
    return {
      ok: false,
      ticketId: worklogEntry.ticketId,
      kind: 'network',
      message: error instanceof Error ? error.message : "Network and connection error, please try again.",
      retryable: true,
    }
  }

  if (!response.ok) {
    const resStatus = response.status;
    const errorBody = await response.text();
    const errorKind = classifyStatus(resStatus);
    return {
      ok: false,
      ticketId: worklogEntry.ticketId,
      kind: errorKind,
      status: resStatus,
      message: buildErrorMessage(errorKind, resStatus, errorBody),
      retryable: isRetryable(errorKind),
    }
  }

  const data = await response.json();
  // if (data) {}
  return {
    ok: true,
    ticketId: worklogEntry.ticketId,
    worklogId: data.id,
  }
}