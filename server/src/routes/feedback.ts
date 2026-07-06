import { Router } from "express";
import type { EmailSender } from "../feedback/sendFeedbackEmail.js";
import { validateFeedbackBody } from "../feedback/validateFeedbackBody.js";

export interface FeedbackRouterDeps {
  readonly emailSender: EmailSender | null;
  readonly now: () => number;
}

// Best-effort, per-instance rate limit. On serverless this resets per instance,
// so it is a speed-bump, not a wall — paired with the honeypot and Resend's own
// limits, that is proportionate for this app's volume.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

export function createFeedbackRouter(deps: FeedbackRouterDeps): Router {
  const router = Router();
  const sendTimestamps: number[] = [];

  router.post("/", async (req, res) => {
    if (!deps.emailSender) {
      res.status(503).json({
        error: "not_configured",
        message: "Feedback isn't configured on this server.",
      });
      return;
    }

    const now = deps.now();
    while (sendTimestamps.length > 0 && now - sendTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
      sendTimestamps.shift();
    }
    if (sendTimestamps.length >= RATE_LIMIT_MAX) {
      res.status(429).json({
        error: "rate_limited",
        message: "Too many reports just now. Please wait a moment and try again.",
      });
      return;
    }

    const validation = validateFeedbackBody(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: "bad_request", message: validation.message });
      return;
    }
    const { honeypot, type, message, email, context } = validation.value;

    // Honeypot: a real user never fills this hidden field. Accept silently so a
    // bot believes it succeeded, but never actually send.
    if (honeypot !== "") {
      res.status(200).json({ ok: true });
      return;
    }

    sendTimestamps.push(now);
    try {
      await deps.emailSender.send({ type, message, email, context });
      res.status(200).json({ ok: true });
    } catch (error) {
      // Safety net (D8): log the payload so a Resend outage leaves a recoverable
      // trace in the server logs rather than silently dropping the report.
      console.error(
        "[instalog] feedback email failed. Payload:",
        JSON.stringify({ type, message, email, context }),
        error,
      );
      res.status(502).json({
        error: "send_failed",
        message: "Couldn't send your feedback right now. Please try again.",
      });
    }
  });

  return router;
}
