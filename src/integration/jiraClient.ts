import type { JiraWorklog, SubmissionErrorKind } from "../types/shared";

function classifyStatus(status: number): SubmissionErrorKind {
  if (status === 401) return 'auth';
  if (status === 403) return 'permission';
  if (status === 404) return 'not-found';
  if (status >= 500) return 'server';
  return 'unknown';
}

function isRetryable() {}

function buildErrorMessage() {}

export async function postWorklog(worklogEntry: JiraWorklog) {
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
  } catch(err) {
    console.error(err)
  }

  if (!response.ok) {
    return {
      ok: false,
      ticketId: worklogEntry.ticketId,
      kind: '',
      status: response.status,
      message: '',
      retryable: ''
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