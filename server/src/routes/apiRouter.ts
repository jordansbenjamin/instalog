import { Router, type Request } from "express";
import {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  JiraCoreError,
  type JiraCore,
} from "../jira-core";
import type {
  Session,
  SessionStore,
  TokenStore,
  UserStore,
} from "../store";
import type { TokenCipher } from "../crypto/tokenCipher";
import { needsRefresh } from "../auth/needsRefresh";
import { toAccount, hostFromUrl } from "./account";
import {
  SESSION_COOKIE,
  PKCE_COOKIE,
  sessionCookieOptions,
  pkceCookieOptions,
} from "./cookies";

export interface ApiRouterDeps {
  readonly jira: JiraCore;
  readonly tokenStore: TokenStore;
  readonly userStore: UserStore;
  readonly sessionStore: SessionStore;
  readonly cipher: TokenCipher; // encrypts the PKCE cookie during the authorize hop
  readonly isProduction: boolean;
  readonly now: () => number;
}

// SubmissionResult kinds the frontend understands (src/types/shared.ts). jira-core's
// internal kinds (invalid-grant/invalid-response) are mapped onto these here.
type SubmissionErrorKind =
  | "permission"
  | "not-found"
  | "server"
  | "network"
  | "unknown";

const HOME_REDIRECT = "/";
const ERROR_REDIRECT = "/?connect=error";

function ticketErrorMessage(kind: SubmissionErrorKind, status?: number): string {
  switch (kind) {
    case "permission":
      return "You don't have permission to log work on this issue.";
    case "not-found":
      return "This ticket doesn't exist in Jira. Check the ticket ID.";
    case "server":
      return `Jira is having trouble (${status ?? "5xx"}). Try again in a moment.`;
    case "network":
      return "Couldn't reach Jira. Check your connection and try again.";
    default:
      return "Unexpected error from Jira. Please try again.";
  }
}

/** Map a jira-core error onto the frontend SubmissionResult failure shape (HTTP 200). */
function ticketErrorResult(ticketId: string, error: JiraCoreError) {
  const kind: SubmissionErrorKind =
    error.kind === "permission" ||
    error.kind === "not-found" ||
    error.kind === "server" ||
    error.kind === "network"
      ? error.kind
      : "unknown";
  return {
    ok: false as const,
    ticketId,
    kind,
    status: error.status,
    message: ticketErrorMessage(kind, error.status),
    retryable: kind === "server" || kind === "network",
  };
}

export function createApiRouter(deps: ApiRouterDeps): Router {
  const router = Router();

  async function getSession(req: Request): Promise<Session | null> {
    const sessionId: unknown = req.cookies?.[SESSION_COOKIE];
    if (typeof sessionId !== "string" || sessionId === "") {
      return null;
    }
    return deps.sessionStore.get(sessionId);
  }

  // Step 2: redirect the user to Atlassian, stashing state + PKCE verifier in an
  // encrypted httpOnly cookie that only /callback can read.
  router.get("/jira/authorize", async (_req, res) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const stash = await deps.cipher.encrypt(JSON.stringify({ state, codeVerifier }));
    res.cookie(PKCE_COOKIE, stash, pkceCookieOptions(deps.isProduction));
    res.redirect(deps.jira.buildAuthorizeUrl(state, codeChallenge));
  });

  // Step 4: verify state, exchange the code, persist user + tokens, open a session.
  router.get("/jira/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      const pkceCookie: unknown = req.cookies?.[PKCE_COOKIE];
      if (
        typeof code !== "string" ||
        typeof state !== "string" ||
        typeof pkceCookie !== "string"
      ) {
        throw new Error("Missing code, state, or PKCE cookie.");
      }
      res.clearCookie(PKCE_COOKIE, pkceCookieOptions(deps.isProduction));

      const stash = JSON.parse(await deps.cipher.decrypt(pkceCookie)) as {
        state: string;
        codeVerifier: string;
      };
      if (stash.state !== state) {
        throw new Error("State mismatch — possible CSRF.");
      }

      const tokens = await deps.jira.exchangeCodeForTokens(code, stash.codeVerifier);
      const resource = (await deps.jira.getAccessibleResources(tokens.accessToken))[0];
      if (!resource) {
        throw new Error("No accessible Jira sites for this account.");
      }
      const profile = await deps.jira.getCurrentUser(tokens.accessToken);

      await deps.userStore.save({
        atlassianAccountId: profile.accountId,
        name: profile.name,
        email: profile.email,
        cloudId: resource.cloudId,
        site: hostFromUrl(resource.url),
      });
      await deps.tokenStore.save(profile.accountId, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessExpiresAt: deps.now() + tokens.expiresInSeconds * 1000,
      });
      const session = await deps.sessionStore.create(profile.accountId);
      res.cookie(SESSION_COOKIE, session.sessionId, sessionCookieOptions(deps.isProduction));
      res.redirect(HOME_REDIRECT);
    } catch (error) {
      console.error("[instalog] OAuth callback failed:", error);
      res.redirect(ERROR_REDIRECT);
    }
  });

  // Step 5: refresh-if-needed, then post. 401 = reconnect; 200 = ticket-level result.
  router.post("/jira/worklog", async (req, res) => {
    const session = await getSession(req);
    if (!session) {
      res.status(401).json({ error: "no_session", message: "Not connected to Jira." });
      return;
    }
    const accountId = session.atlassianAccountId;
    const [user, stored] = await Promise.all([
      deps.userStore.get(accountId),
      deps.tokenStore.get(accountId),
    ]);
    if (!user || !stored) {
      res.status(401).json({ error: "reconnect", message: "Your connection expired. Please reconnect." });
      return;
    }

    const body = (req.body ?? {}) as { ticketId?: unknown; body?: unknown };
    if (
      typeof body.ticketId !== "string" ||
      body.ticketId === "" ||
      body.body === null ||
      typeof body.body !== "object"
    ) {
      res.status(400).json({ error: "bad_request", message: "worklog requires ticketId and body." });
      return;
    }
    const ticketId = body.ticketId;

    let accessToken = stored.accessToken;
    if (needsRefresh(stored.accessExpiresAt, deps.now())) {
      try {
        const fresh = await deps.jira.refreshTokens(stored.refreshToken);
        accessToken = fresh.accessToken;
        await deps.tokenStore.save(accountId, {
          accessToken: fresh.accessToken,
          refreshToken: fresh.refreshToken,
          accessExpiresAt: deps.now() + fresh.expiresInSeconds * 1000,
        });
      } catch (error) {
        if (error instanceof JiraCoreError && error.kind === "invalid-grant") {
          res.status(401).json({ error: "reconnect", message: "Your Jira session expired. Please reconnect." });
          return;
        }
        throw error;
      }
    }

    try {
      const { worklogId } = await deps.jira.postWorklog(user.cloudId, accessToken, {
        ticketId,
        body: body.body,
      });
      res.json({ ok: true, ticketId, worklogId });
    } catch (error) {
      if (error instanceof JiraCoreError) {
        if (error.kind === "auth" || error.kind === "invalid-grant") {
          res.status(401).json({ error: "reconnect", message: "Your Jira session expired. Please reconnect." });
          return;
        }
        res.json(ticketErrorResult(ticketId, error));
        return;
      }
      throw error;
    }
  });

  // Step 6: tear down the session + stored tokens.
  router.post("/jira/disconnect", async (req, res) => {
    const session = await getSession(req);
    if (session) {
      await deps.sessionStore.destroy(session.sessionId);
      await deps.tokenStore.delete(session.atlassianAccountId);
      await deps.userStore.delete(session.atlassianAccountId);
    }
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions(deps.isProduction));
    res.status(204).end();
  });

  // Current account for the header pill. Disconnected is normal, not an error.
  router.get("/me", async (req, res) => {
    const session = await getSession(req);
    if (!session) {
      res.json({ account: null });
      return;
    }
    const user = await deps.userStore.get(session.atlassianAccountId);
    if (!user) {
      res.json({ account: null });
      return;
    }
    res.json({ account: toAccount(user.name, user.site) });
  });

  return router;
}
