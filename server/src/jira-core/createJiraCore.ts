import { JiraCoreError, classifyStatus } from "./errors";
import type {
  AccessibleResource,
  AtlassianTokens,
  JiraCoreConfig,
  WorklogInput,
  WorklogResult,
} from "./types";

const AUTHORIZE_URL = "https://auth.atlassian.com/authorize";
const TOKEN_URL = "https://auth.atlassian.com/oauth/token";
const ACCESSIBLE_RESOURCES_URL =
  "https://api.atlassian.com/oauth/token/accessible-resources";
const JIRA_API_BASE = "https://api.atlassian.com/ex/jira";

/** Bearer-authenticated fetch with the network failure wrapped into a JiraCoreError. */
async function bearerFetch(
  url: string,
  accessToken: string,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    throw new JiraCoreError(
      "network",
      error instanceof Error ? error.message : "Network error reaching Atlassian.",
    );
  }
}

function toAccessibleResource(raw: unknown): AccessibleResource {
  if (
    typeof raw !== "object" ||
    raw === null ||
    !("id" in raw) ||
    typeof raw.id !== "string"
  ) {
    throw new JiraCoreError(
      "invalid-response",
      "accessible-resources entry was malformed.",
    );
  }
  const entry = raw as {
    id: string;
    url?: unknown;
    name?: unknown;
    scopes?: unknown;
  };
  return {
    cloudId: entry.id,
    url: typeof entry.url === "string" ? entry.url : "",
    name: typeof entry.name === "string" ? entry.name : "",
    scopes: Array.isArray(entry.scopes)
      ? entry.scopes.filter((scope): scope is string => typeof scope === "string")
      : [],
  };
}

interface TokenResponseBody {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
}

function isTokenResponse(data: unknown): data is TokenResponseBody {
  return (
    typeof data === "object" &&
    data !== null &&
    "access_token" in data &&
    typeof data.access_token === "string" &&
    "refresh_token" in data &&
    typeof data.refresh_token === "string" &&
    "expires_in" in data &&
    typeof data.expires_in === "number"
  );
}

/** OAuth token errors arrive as 4xx with a JSON `{ error: "invalid_grant" }`. */
function isInvalidGrant(body: string): boolean {
  try {
    const parsed: unknown = JSON.parse(body);
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      parsed.error === "invalid_grant"
    );
  } catch {
    return false;
  }
}

/**
 * Build the framework-agnostic Jira OAuth + worklog functions, bound to one app's
 * config. Pure core: no Express, no DB, no process.env — the shell supplies config
 * and persistence. Functions throw JiraCoreError on failure.
 */
export function createJiraCore(config: JiraCoreConfig) {
  function buildAuthorizeUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      audience: "api.atlassian.com",
      client_id: config.clientId,
      scope: config.scopes.join(" "),
      redirect_uri: config.redirectUri,
      state,
      response_type: "code",
      prompt: "consent",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  }

  /** Shared POST to the token endpoint; the two grants differ only in body. */
  async function requestToken(
    body: Record<string, string>,
  ): Promise<AtlassianTokens> {
    let response: Response;
    try {
      response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new JiraCoreError(
        "network",
        error instanceof Error ? error.message : "Network error reaching Atlassian.",
      );
    }

    if (!response.ok) {
      const text = await response.text();
      if (isInvalidGrant(text)) {
        throw new JiraCoreError(
          "invalid-grant",
          "Atlassian rejected the grant — the user must reconnect.",
          response.status,
        );
      }
      throw new JiraCoreError(
        classifyStatus(response.status),
        `Token request failed (${response.status}).`,
        response.status,
      );
    }

    const data: unknown = await response.json().catch(() => null);
    if (!isTokenResponse(data)) {
      throw new JiraCoreError(
        "invalid-response",
        "Token response was missing required fields.",
      );
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      scope: data.scope ?? "",
      expiresInSeconds: data.expires_in,
    };
  }

  function exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
  ): Promise<AtlassianTokens> {
    return requestToken({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    });
  }

  function refreshTokens(refreshToken: string): Promise<AtlassianTokens> {
    return requestToken({
      grant_type: "refresh_token",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    });
  }

  async function getAccessibleResources(
    accessToken: string,
  ): Promise<AccessibleResource[]> {
    const response = await bearerFetch(ACCESSIBLE_RESOURCES_URL, accessToken);
    if (!response.ok) {
      throw new JiraCoreError(
        classifyStatus(response.status),
        `Failed to list accessible resources (${response.status}).`,
        response.status,
      );
    }
    const data: unknown = await response.json().catch(() => null);
    if (!Array.isArray(data)) {
      throw new JiraCoreError(
        "invalid-response",
        "accessible-resources response was not an array.",
      );
    }
    return data.map(toAccessibleResource);
  }

  async function postWorklog(
    cloudId: string,
    accessToken: string,
    worklog: WorklogInput,
  ): Promise<WorklogResult> {
    const url = `${JIRA_API_BASE}/${cloudId}/rest/api/3/issue/${worklog.ticketId}/worklog`;
    const response = await bearerFetch(url, accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(worklog.body),
    });

    if (!response.ok) {
      throw new JiraCoreError(
        classifyStatus(response.status),
        `Failed to post worklog to ${worklog.ticketId} (${response.status}).`,
        response.status,
      );
    }

    const data: unknown = await response.json().catch(() => null);
    if (
      typeof data !== "object" ||
      data === null ||
      !("id" in data) ||
      typeof data.id !== "string"
    ) {
      throw new JiraCoreError(
        "invalid-response",
        "Jira accepted the worklog but returned no id.",
      );
    }
    return { worklogId: data.id };
  }

  return {
    buildAuthorizeUrl,
    exchangeCodeForTokens,
    refreshTokens,
    getAccessibleResources,
    postWorklog,
  };
}
