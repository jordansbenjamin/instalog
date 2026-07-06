import express, { type Express, type Router } from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { existsSync } from "node:fs";
import { healthRouter } from "./routes/health.js";

export interface AppDeps {
  /** The /jira/* + /me router, built with its store/jira-core/cipher dependencies. */
  readonly apiRouter: Router;
  /** The /feedback router. Optional so tests can omit it. */
  readonly feedbackRouter?: Router;
}

/** The Vite SPA build output, served in production. From server/src → instalog/dist. */
export const distPath: string = path.resolve(import.meta.dirname, "../../dist");
export const indexHtmlPath: string = path.join(distPath, "index.html");

/**
 * Build the configured Express app WITHOUT binding a port. Keeping this separate
 * from `index.ts` makes the app importable for tests (e.g. supertest) later.
 *
 * Middleware order is load-bearing:
 *   1. JSON body parsing.
 *   2. /api router — ends in a JSON 404 so unknown API routes never fall through
 *      to the SPA's index.html (which would send HTML where the client expects JSON).
 *   3. express.static — serve the built SPA assets.
 *   4. Catch-all — return index.html so client-side routing works on deep links.
 */
export function buildApp(deps: AppDeps): Express {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  const api = express.Router();
  api.use("/health", healthRouter);
  api.use(deps.apiRouter); // /jira/* and /me
  if (deps.feedbackRouter) {
    api.use("/feedback", deps.feedbackRouter);
  }
  api.use((_req, res) => {
    res.status(404).json({ error: "not_found", message: "Unknown API route." });
  });
  app.use("/api", api);

  app.use(express.static(distPath));
  app.use((_req, res) => {
    if (!existsSync(indexHtmlPath)) {
      res
        .status(503)
        .type("text/plain")
        .send("SPA build not found. Run `npm run build` at the repo root.");
      return;
    }
    res.sendFile(indexHtmlPath);
  });

  return app;
}
