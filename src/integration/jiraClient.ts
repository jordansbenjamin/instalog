import type { JiraWorklog } from "../types/shared";

export async function postWorklog(worklogEntry: JiraWorklog) {
  const baseUrl = import.meta.env.VITE_JIRA_BASE_URL;
  const username = import.meta.env.VITE_JIRA_EMAIL;
  const password = import.meta.env.VITE_JIRA_API_TOKEN;
  
  if (!baseUrl || !username || !password) {
    return {
      ok: false,
      ticketId: worklogEntry.ticketId,
      kind: 'config',
      message: "Jira credentials are not configured. Check your .env file"
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