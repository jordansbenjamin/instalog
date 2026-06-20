import { existsSync } from "node:fs";
import { MongoClient } from "mongodb";
import { env } from "./config/env.js";
import { buildApp, indexHtmlPath } from "./app.js";
import { createApiRouterForDb } from "./wiring.js";

async function main(): Promise<void> {
  const client = new MongoClient(env.mongoUri);
  await client.connect();
  const db = client.db(); // database name comes from the connection string

  const app = buildApp({ apiRouter: createApiRouterForDb(db) });

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
