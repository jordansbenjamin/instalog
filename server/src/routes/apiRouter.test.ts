import { describe, it, expect, vi } from "vitest";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { createApiRouter } from "./apiRouter";
import { SESSION_COOKIE } from "./cookies";
import {
  createInMemoryTokenStore,
  createInMemorySessionStore,
  createInMemoryUserStore,
  type SessionStore,
  type TokenStore,
  type UserStore,
} from "../store";
import { createTokenCipher } from "../crypto/tokenCipher";
import type { JiraCore } from "../jira-core";

const CIPHER_KEY = btoa("0123456789abcdef0123456789abcdef");
const FIXED_NOW = 1_000_000;

function makeFakeJira(overrides: Partial<JiraCore> = {}): JiraCore {
  return {
    buildAuthorizeUrl: vi.fn(
      (state: string, challenge: string) =>
        `https://auth.atlassian.com/authorize?state=${state}&code_challenge=${challenge}`,
    ),
    exchangeCodeForTokens: vi.fn(async () => ({
      accessToken: "at-1",
      refreshToken: "rt-1",
      scope: "read:me",
      expiresInSeconds: 3600,
    })),
    refreshTokens: vi.fn(async () => ({
      accessToken: "at-2",
      refreshToken: "rt-2",
      scope: "read:me",
      expiresInSeconds: 3600,
    })),
    getAccessibleResources: vi.fn(async () => [
      { cloudId: "cloud-1", url: "https://acme.atlassian.net", name: "Acme", scopes: [] },
    ]),
    getCurrentUser: vi.fn(async () => ({
      accountId: "acc-1",
      name: "Maddy Chen",
      email: "maddy@acme.test",
    })),
    postWorklog: vi.fn(async () => ({ worklogId: "wl-1" })),
    ...overrides,
  };
}

interface Harness {
  app: Express;
  jira: JiraCore;
  tokenStore: TokenStore;
  userStore: UserStore;
  sessionStore: SessionStore;
  now: number;
}

function makeHarness(jiraOverrides: Partial<JiraCore> = {}): Harness {
  const jira = makeFakeJira(jiraOverrides);
  const tokenStore = createInMemoryTokenStore();
  const userStore = createInMemoryUserStore();
  let counter = 0;
  const sessionStore = createInMemorySessionStore({
    now: () => FIXED_NOW,
    ttlMs: 1_000_000,
    generateId: () => `sid-${++counter}`,
  });
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    "/api",
    createApiRouter({
      jira,
      tokenStore,
      userStore,
      sessionStore,
      cipher: createTokenCipher(CIPHER_KEY),
      isProduction: false,
      now: () => FIXED_NOW,
    }),
  );
  return { app, jira, tokenStore, userStore, sessionStore, now: FIXED_NOW };
}

/** Seed a logged-in user + tokens + session, returning the session cookie header. */
async function seedSession(
  h: Harness,
  tokenOverrides: Partial<{ accessExpiresAt: number }> = {},
): Promise<string> {
  await h.userStore.save({
    atlassianAccountId: "acc-1",
    name: "Maddy Chen",
    email: "maddy@acme.test",
    cloudId: "cloud-1",
    site: "acme.atlassian.net",
  });
  await h.tokenStore.save("acc-1", {
    accessToken: "at-1",
    refreshToken: "rt-1",
    accessExpiresAt: FIXED_NOW + 3_600_000,
    ...tokenOverrides,
  });
  const session = await h.sessionStore.create("acc-1");
  return `${SESSION_COOKIE}=${session.sessionId}`;
}

describe("GET /api/jira/authorize", () => {
  it("redirects to the authorize url and sets an httpOnly PKCE cookie", async () => {
    const h = makeHarness();
    const res = await request(h.app).get("/api/jira/authorize");

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("auth.atlassian.com/authorize");
    const setCookie = String(res.headers["set-cookie"]);
    expect(setCookie).toContain("instalog_pkce=");
    expect(setCookie.toLowerCase()).toContain("httponly");
  });
});

describe("GET /api/jira/callback", () => {
  it("exchanges the code, persists user + tokens, opens a session, and redirects home", async () => {
    const h = makeHarness();
    const agent = request.agent(h.app);

    const authRes = await agent.get("/api/jira/authorize");
    const state = new URL(authRes.headers.location).searchParams.get("state")!;
    const res = await agent.get(
      `/api/jira/callback?code=the-code&state=${state}`,
    );

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/");
    expect(h.jira.exchangeCodeForTokens).toHaveBeenCalledWith(
      "the-code",
      expect.any(String),
    );
    expect(await h.tokenStore.get("acc-1")).toMatchObject({ accessToken: "at-1" });
    expect(await h.userStore.get("acc-1")).toMatchObject({
      name: "Maddy Chen",
      cloudId: "cloud-1",
      site: "acme.atlassian.net",
    });
    expect(String(res.headers["set-cookie"])).toContain("instalog_session=");
  });

  it("rejects a state that does not match the PKCE cookie (CSRF)", async () => {
    const h = makeHarness();
    const agent = request.agent(h.app);
    await agent.get("/api/jira/authorize");

    const res = await agent.get("/api/jira/callback?code=x&state=forged-state");

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("connect=error");
    expect(h.jira.exchangeCodeForTokens).not.toHaveBeenCalled();
    expect(await h.tokenStore.get("acc-1")).toBeNull();
  });

  it("errors when the PKCE cookie is missing", async () => {
    const h = makeHarness();
    const res = await request(h.app).get(
      "/api/jira/callback?code=x&state=whatever",
    );
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("connect=error");
  });

  it("errors when the account has no accessible Jira sites", async () => {
    const h = makeHarness({ getAccessibleResources: vi.fn(async () => []) });
    const agent = request.agent(h.app);
    const authRes = await agent.get("/api/jira/authorize");
    const state = new URL(authRes.headers.location).searchParams.get("state")!;

    const res = await agent.get(`/api/jira/callback?code=c&state=${state}`);

    expect(res.headers.location).toContain("connect=error");
    expect(await h.tokenStore.get("acc-1")).toBeNull();
  });
});

describe("GET /api/me", () => {
  it("returns account:null with no session", async () => {
    const h = makeHarness();
    const res = await request(h.app).get("/api/me");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ account: null });
  });

  it("returns the account for a live session", async () => {
    const h = makeHarness();
    const cookie = await seedSession(h);
    const res = await request(h.app).get("/api/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      account: {
        name: "Maddy Chen",
        site: "acme.atlassian.net",
        initials: "MC",
        isDemo: false,
      },
    });
  });
});

describe("POST /api/jira/worklog", () => {
  const worklog = { ticketId: "ABC-1", body: { timeSpentSeconds: 3600 } };

  it("401s without a session", async () => {
    const h = makeHarness();
    const res = await request(h.app).post("/api/jira/worklog").send(worklog);
    expect(res.status).toBe(401);
  });

  it("posts the worklog and returns a success SubmissionResult", async () => {
    const h = makeHarness();
    const cookie = await seedSession(h);
    const res = await request(h.app)
      .post("/api/jira/worklog")
      .set("Cookie", cookie)
      .send(worklog);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, ticketId: "ABC-1", worklogId: "wl-1" });
    expect(h.jira.postWorklog).toHaveBeenCalledWith("cloud-1", "at-1", worklog);
    expect(h.jira.refreshTokens).not.toHaveBeenCalled();
  });

  it("refreshes the access token first when it is near expiry, then posts", async () => {
    const h = makeHarness();
    const cookie = await seedSession(h, { accessExpiresAt: FIXED_NOW - 1 });
    const res = await request(h.app)
      .post("/api/jira/worklog")
      .set("Cookie", cookie)
      .send(worklog);

    expect(res.status).toBe(200);
    expect(h.jira.refreshTokens).toHaveBeenCalledWith("rt-1");
    expect(h.jira.postWorklog).toHaveBeenCalledWith("cloud-1", "at-2", worklog);
    expect(await h.tokenStore.get("acc-1")).toMatchObject({ accessToken: "at-2" });
  });

  it("401s for reconnect when the refresh token is revoked", async () => {
    const { JiraCoreError } = await import("../jira-core/errors");
    const h = makeHarness({
      refreshTokens: vi.fn(async () => {
        throw new JiraCoreError("invalid-grant", "revoked", 400);
      }),
    });
    const cookie = await seedSession(h, { accessExpiresAt: FIXED_NOW - 1 });
    const res = await request(h.app)
      .post("/api/jira/worklog")
      .set("Cookie", cookie)
      .send(worklog);
    expect(res.status).toBe(401);
  });

  it("returns a 200 failure result for a ticket-level error (not-found)", async () => {
    const { JiraCoreError } = await import("../jira-core/errors");
    const h = makeHarness({
      postWorklog: vi.fn(async () => {
        throw new JiraCoreError("not-found", "no such issue", 404);
      }),
    });
    const cookie = await seedSession(h);
    const res = await request(h.app)
      .post("/api/jira/worklog")
      .set("Cookie", cookie)
      .send(worklog);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: false,
      ticketId: "ABC-1",
      kind: "not-found",
      retryable: false,
    });
  });

  it("401s for reconnect when a worklog call unexpectedly returns auth", async () => {
    const { JiraCoreError } = await import("../jira-core/errors");
    const h = makeHarness({
      postWorklog: vi.fn(async () => {
        throw new JiraCoreError("auth", "token rejected", 401);
      }),
    });
    const cookie = await seedSession(h);
    const res = await request(h.app)
      .post("/api/jira/worklog")
      .set("Cookie", cookie)
      .send(worklog);
    expect(res.status).toBe(401);
  });

  it("400s on a malformed body", async () => {
    const h = makeHarness();
    const cookie = await seedSession(h);
    const res = await request(h.app)
      .post("/api/jira/worklog")
      .set("Cookie", cookie)
      .send({ body: { x: 1 } }); // missing ticketId
    expect(res.status).toBe(400);
  });
});

describe("POST /api/jira/disconnect", () => {
  it("destroys the session + tokens and clears the cookie", async () => {
    const h = makeHarness();
    const cookie = await seedSession(h);

    const res = await request(h.app)
      .post("/api/jira/disconnect")
      .set("Cookie", cookie);

    expect(res.status).toBe(204);
    expect(await h.tokenStore.get("acc-1")).toBeNull();

    const me = await request(h.app).get("/api/me").set("Cookie", cookie);
    expect(me.body).toEqual({ account: null });
  });

  it("is a no-op (204) without a session", async () => {
    const h = makeHarness();
    const res = await request(h.app).post("/api/jira/disconnect");
    expect(res.status).toBe(204);
  });
});
