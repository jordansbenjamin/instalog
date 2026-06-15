import { existsSync } from "node:fs";
import { env } from "./config/env";
import { buildApp, indexHtmlPath } from "./app";

const app = buildApp();

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
