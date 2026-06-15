import type { Account } from "../../types/shared";
import type { ConnectionService } from "./ConnectionService";

// The real connection: a Sign-in-with-Atlassian OAuth 3LO flow that lives behind
// the same-origin backend. Unlike the simulated/demo services, connecting is a
// full-page REDIRECT (the browser leaves for Atlassian and returns to "/"), so
// connect() never resolves an Account here — the app relearns its state on load
// via getCurrentAccount() (GET /api/me).
const AUTHORIZE_URL = "/api/jira/authorize";
const DISCONNECT_URL = "/api/jira/disconnect";
const ME_URL = "/api/me";

export const atlassianConnection: ConnectionService = {
  connect(): Promise<Account> {
    window.location.assign(AUTHORIZE_URL);
    // The page is navigating away; this promise intentionally never settles.
    return new Promise<Account>(() => {});
  },
  async disconnect(): Promise<void> {
    await fetch(DISCONNECT_URL, { method: "POST", credentials: "include" });
  },
};

/** The current account from the server session, or null if not connected. */
export async function getCurrentAccount(): Promise<Account | null> {
  try {
    const response = await fetch(ME_URL, { credentials: "include" });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { account: Account | null };
    return data.account ?? null;
  } catch {
    // Network error / server down — treat as "not connected" rather than crash.
    return null;
  }
}
