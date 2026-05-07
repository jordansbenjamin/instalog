import type { JiraWorklog } from "../types/shared";

export async function postWorklog(worklogEntry: JiraWorklog) {
  const baseUrl = import.meta.env.VITE_JIRA_BASE_URL;
  const username = import.meta.env.VITE_JIRA_EMAIL;
  const password = import.meta.env.VITE_JIRA_API_TOKEN;
  
  if (!baseUrl || !username || !password) {
    return {
      errorMessage: "Jira credentials are not configured. Check your .env file"
    }
  }

  const url = `${baseUrl}/issue/${worklogEntry.ticketId}/worklog`;
  const auth = btoa(`${username}:${password}`);

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Basic ${auth}`,
    "X-Atlassian-Token": "no-check",
  };

  let response: Response;

  try {
    response = fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(worklogEntry.body)
    });
  } catch(err) {
    console.error(err)
  }
}