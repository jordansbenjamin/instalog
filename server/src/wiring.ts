import type { Db } from "mongodb";
import type { Router } from "express";
import { env, ATLASSIAN_SCOPES } from "./config/env.js";
import { createJiraCore } from "./jira-core/index.js";
import { createTokenCipher } from "./crypto/tokenCipher.js";
import {
  createMongoTokenStore,
  createMongoUserStore,
  createMongoSessionStore,
} from "./store/index.js";
import { createApiRouter } from "./routes/apiRouter.js";
import { SESSION_TTL_MS } from "./routes/cookies.js";
import { generateSessionId } from "./auth/sessionId.js";

// Composition root for the API: wires jira-core + the Mongo stores + the cipher
// into the request router, given a connected Db. Shared by both runtime shells —
// the local long-lived server (index.ts) and the Vercel serverless function
// (serverlessApp.ts) — so the wiring lives in exactly one place.
export function createApiRouterForDb(db: Db): Router {
  const cipher = createTokenCipher(env.tokenEncryptionKey);
  const jira = createJiraCore({
    clientId: env.atlassian.clientId,
    clientSecret: env.atlassian.clientSecret,
    redirectUri: env.atlassian.redirectUri,
    scopes: ATLASSIAN_SCOPES,
  });

  return createApiRouter({
    jira,
    tokenStore: createMongoTokenStore(db, cipher),
    userStore: createMongoUserStore(db),
    sessionStore: createMongoSessionStore(db, {
      now: () => Date.now(),
      ttlMs: SESSION_TTL_MS,
      generateId: generateSessionId,
    }),
    cipher,
    isProduction: env.isProduction,
    now: () => Date.now(),
  });
}
