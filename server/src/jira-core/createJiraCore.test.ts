import { describe, it, expect, vi, afterEach } from "vitest";
import { createJiraCore } from "./createJiraCore";
import { JiraCoreError } from "./errors";
import type { JiraCoreConfig } from "./types";

const config: JiraCoreConfig = {
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
  redirectUri: "https://app.test/api/jira/callback",
  scopes: ["read:me", "read:jira-work", "write:jira-work", "offline_access"],
};

const jira = createJiraCore(config);

/** Stub global fetch to return one JSON response, and capture the call args. */
function mockFetchJson(body: unknown, status = 200): ReturnType<typeof vi.fn> {
  const fn = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

/** The JSON body of the single recorded fetch call. */
function sentBody(fn: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const init = fn.mock.calls[0][1] as RequestInit;
  return JSON.parse(init.body as string);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildAuthorizeUrl", () => {
  const url = new URL(jira.buildAuthorizeUrl("state-123", "challenge-abc"));

  it("targets Atlassian's authorize endpoint", () => {
    expect(`${url.origin}${url.pathname}`).toBe(
      "https://auth.atlassian.com/authorize",
    );
  });

  it("carries the PKCE + OAuth params (S256, consent, space-joined scopes)", () => {
    const params = url.searchParams;
    expect(params.get("audience")).toBe("api.atlassian.com");
    expect(params.get("client_id")).toBe("test-client-id");
    expect(params.get("redirect_uri")).toBe(
      "https://app.test/api/jira/callback",
    );
    expect(params.get("scope")).toBe(
      "read:me read:jira-work write:jira-work offline_access",
    );
    expect(params.get("state")).toBe("state-123");
    expect(params.get("response_type")).toBe("code");
    expect(params.get("prompt")).toBe("consent");
    expect(params.get("code_challenge")).toBe("challenge-abc");
    expect(params.get("code_challenge_method")).toBe("S256");
  });

  it("never leaks the client secret into the browser-facing URL", () => {
    expect(jira.buildAuthorizeUrl("s", "c")).not.toContain("test-client-secret");
  });
});

const TOKEN_RESPONSE = {
  access_token: "access-abc",
  refresh_token: "refresh-xyz",
  expires_in: 3600,
  scope: "read:me read:jira-work",
  token_type: "Bearer",
};

describe("exchangeCodeForTokens", () => {
  it("POSTs the auth code + client credentials + PKCE verifier to the token endpoint", async () => {
    const fetchMock = mockFetchJson(TOKEN_RESPONSE);

    await jira.exchangeCodeForTokens("auth-code-1", "verifier-1");

    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe("https://auth.atlassian.com/oauth/token");
    expect(init.method).toBe("POST");
    expect(sentBody(fetchMock)).toEqual({
      grant_type: "authorization_code",
      client_id: "test-client-id",
      client_secret: "test-client-secret",
      code: "auth-code-1",
      redirect_uri: "https://app.test/api/jira/callback",
      code_verifier: "verifier-1",
    });
  });

  it("returns tokens normalised to clock-free shape (raw expires_in)", async () => {
    mockFetchJson(TOKEN_RESPONSE);

    const tokens = await jira.exchangeCodeForTokens("code", "verifier");

    expect(tokens).toEqual({
      accessToken: "access-abc",
      refreshToken: "refresh-xyz",
      scope: "read:me read:jira-work",
      expiresInSeconds: 3600,
    });
  });

  it("throws invalid-grant when Atlassian rejects the code", async () => {
    mockFetchJson({ error: "invalid_grant" }, 400);

    await expect(
      jira.exchangeCodeForTokens("bad-code", "verifier"),
    ).rejects.toMatchObject({ kind: "invalid-grant" });
  });

  it("throws invalid-response when the token body omits required fields", async () => {
    mockFetchJson({ token_type: "Bearer" }, 200);

    await expect(
      jira.exchangeCodeForTokens("code", "verifier"),
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it("throws network when fetch itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    const error = await jira
      .exchangeCodeForTokens("code", "verifier")
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(JiraCoreError);
    expect((error as JiraCoreError).kind).toBe("network");
  });
});

describe("refreshTokens", () => {
  it("POSTs the refresh grant with client credentials", async () => {
    const fetchMock = mockFetchJson(TOKEN_RESPONSE);

    await jira.refreshTokens("old-refresh");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://auth.atlassian.com/oauth/token",
    );
    expect(sentBody(fetchMock)).toEqual({
      grant_type: "refresh_token",
      client_id: "test-client-id",
      client_secret: "test-client-secret",
      refresh_token: "old-refresh",
    });
  });

  it("returns the freshly issued tokens", async () => {
    mockFetchJson(TOKEN_RESPONSE);

    const tokens = await jira.refreshTokens("old-refresh");

    expect(tokens.accessToken).toBe("access-abc");
    expect(tokens.refreshToken).toBe("refresh-xyz");
    expect(tokens.expiresInSeconds).toBe(3600);
  });

  it("throws invalid-grant when the refresh token is revoked/expired", async () => {
    mockFetchJson({ error: "invalid_grant" }, 400);

    await expect(jira.refreshTokens("revoked")).rejects.toMatchObject({
      kind: "invalid-grant",
    });
  });
});

/** The Authorization header of the single recorded fetch call. */
function sentAuthHeader(fn: ReturnType<typeof vi.fn>): string | undefined {
  const init = fn.mock.calls[0][1] as RequestInit;
  return new Headers(init.headers).get("authorization") ?? undefined;
}

describe("getAccessibleResources", () => {
  const RESOURCES = [
    {
      id: "cloud-id-1",
      url: "https://acme.atlassian.net",
      name: "Acme",
      scopes: ["read:jira-work", "write:jira-work"],
      avatarUrl: "https://...",
    },
  ];

  it("GETs accessible-resources with the bearer token", async () => {
    const fetchMock = mockFetchJson(RESOURCES);

    await jira.getAccessibleResources("access-abc");

    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe(
      "https://api.atlassian.com/oauth/token/accessible-resources",
    );
    expect(init.method ?? "GET").toBe("GET");
    expect(sentAuthHeader(fetchMock)).toBe("Bearer access-abc");
  });

  it("maps each site's id→cloudId and keeps url/name/scopes", async () => {
    mockFetchJson(RESOURCES);

    const resources = await jira.getAccessibleResources("access-abc");

    expect(resources).toEqual([
      {
        cloudId: "cloud-id-1",
        url: "https://acme.atlassian.net",
        name: "Acme",
        scopes: ["read:jira-work", "write:jira-work"],
      },
    ]);
  });

  it("returns an empty array when the user granted no sites", async () => {
    mockFetchJson([]);

    expect(await jira.getAccessibleResources("access-abc")).toEqual([]);
  });

  it("throws auth when the access token is rejected", async () => {
    mockFetchJson({ message: "Unauthorized" }, 401);

    await expect(
      jira.getAccessibleResources("expired"),
    ).rejects.toMatchObject({ kind: "auth" });
  });
});

describe("postWorklog", () => {
  const worklog = {
    ticketId: "ABC-1",
    body: { timeSpentSeconds: 3600, comment: { type: "doc" } },
  };

  it("POSTs the ADF body to the issue worklog endpoint with bearer auth", async () => {
    const fetchMock = mockFetchJson({ id: "100123" }, 201);

    await jira.postWorklog("cloud-id-1", "access-abc", worklog);

    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe(
      "https://api.atlassian.com/ex/jira/cloud-id-1/rest/api/3/issue/ABC-1/worklog",
    );
    expect(init.method).toBe("POST");
    expect(sentAuthHeader(fetchMock)).toBe("Bearer access-abc");
    expect(new Headers(init.headers).get("content-type")).toBe(
      "application/json",
    );
    expect(sentBody(fetchMock)).toEqual(worklog.body);
  });

  it("returns the new worklog id", async () => {
    mockFetchJson({ id: "100123" }, 201);

    const result = await jira.postWorklog("cloud-id-1", "access-abc", worklog);

    expect(result).toEqual({ worklogId: "100123" });
  });

  it("throws not-found when the issue does not exist", async () => {
    mockFetchJson({ errorMessages: ["Issue does not exist"] }, 404);

    await expect(
      jira.postWorklog("cloud-id-1", "access-abc", worklog),
    ).rejects.toMatchObject({ kind: "not-found", status: 404 });
  });

  it("throws permission when the user cannot log work on the issue", async () => {
    mockFetchJson({ errorMessages: ["Forbidden"] }, 403);

    await expect(
      jira.postWorklog("cloud-id-1", "access-abc", worklog),
    ).rejects.toMatchObject({ kind: "permission" });
  });

  it("throws invalid-response when Jira accepts but returns no worklog id", async () => {
    mockFetchJson({ self: "https://..." }, 201);

    await expect(
      jira.postWorklog("cloud-id-1", "access-abc", worklog),
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });
});
