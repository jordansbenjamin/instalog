import { existsSync } from "node:fs";
import { MongoClient } from "mongodb";
import { env, ATLASSIAN_SCOPES } from "./config/env";
import { buildApp, indexHtmlPath } from "./app";
import { createJiraCore } from "./jira-core";
import { createTokenCipher } from "./crypto/tokenCipher";
import {
  createMongoTokenStore,
  createMongoUserStore,
  createMongoSessionStore,
} from "./store";
import { createApiRouter } from "./routes/apiRouter";
import { SESSION_TTL_MS } from "./routes/cookies";
import { generateSessionId } from "./auth/sessionId";

async function main(): Promise<void> {
  const client = new MongoClient(env.mongoUri);
  await client.connect();
  const db = client.db(); // database name comes from the connection string

  const cipher = createTokenCipher(env.tokenEncryptionKey);
  const jira = createJiraCore({
    clientId: env.atlassian.clientId,
    clientSecret: env.atlassian.clientSecret,
    redirectUri: env.atlassian.redirectUri,
    scopes: ATLASSIAN_SCOPES,
  });

  const apiRouter = createApiRouter({
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

  const app = buildApp({ apiRouter });

  if (!existsSync(indexHtmlPath)) {
    console.warn(
      `[instalog] SPA build not found at ${indexHtmlPath}. ` +
        "The API runs fine, but '/' returns 503 until you run `npm run build` at the repo root.",
    );
  }

  app.listen(env.port, () => {
    console.log(
      `[instalog] server listening on http://localhost:${env.port} (${env.nodeEnv})`,
    );
  });
}

main().catch((error: unknown) => {
  console.error("[instalog] failed to start:", error);
  process.exit(1);
});
