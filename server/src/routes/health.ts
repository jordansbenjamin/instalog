import { Router } from "express";

/**
 * GET /api/health — liveness probe for deploy platforms (Render/Railway) and a
 * trivial end-to-end check that the API layer is wired up. No auth, no DB.
 */
export const healthRouter: Router = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
