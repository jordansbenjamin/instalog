import type { FeedbackContext } from "./sendFeedbackEmail.js";

export interface ValidFeedback {
  type: "bug" | "idea";
  message: string;
  email?: string;
  honeypot: string;
  context: FeedbackContext;
}

export type FeedbackValidation =
  | { ok: true; value: ValidFeedback }
  | { ok: false; message: string };

const MAX_MESSAGE = 5000;
const MAX_FIELD = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFeedbackBody(raw: unknown): FeedbackValidation {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, message: "Request body must be an object." };
  }
  const body = raw as Record<string, unknown>;

  if (body.type !== "bug" && body.type !== "idea") {
    return { ok: false, message: "type must be 'bug' or 'idea'." };
  }
  if (typeof body.message !== "string") {
    return { ok: false, message: "message is required." };
  }
  const message = body.message.trim();
  if (message.length < 1) {
    return { ok: false, message: "message must not be empty." };
  }
  if (message.length > MAX_MESSAGE) {
    return { ok: false, message: `message must be ${MAX_MESSAGE} characters or fewer.` };
  }

  let email: string | undefined;
  if (body.email !== undefined && body.email !== "") {
    if (typeof body.email !== "string" || !EMAIL_RE.test(body.email.trim())) {
      return { ok: false, message: "email is not a valid address." };
    }
    email = body.email.trim();
  }

  const honeypot = typeof body.honeypot === "string" ? body.honeypot : "";
  const context = normalizeContext(body.context);
  return { ok: true, value: { type: body.type, message, email, honeypot, context } };
}

function normalizeContext(raw: unknown): FeedbackContext {
  const c = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    step: cap(str(c.step)),
    isDemo: c.isDemo === true,
    appVersion: cap(str(c.appVersion)),
    userAgent: cap(str(c.userAgent)),
    url: cap(str(c.url)),
    submittedAt: cap(str(c.submittedAt)),
  };
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function cap(value: string): string {
  return value.length > MAX_FIELD ? value.slice(0, MAX_FIELD) : value;
}
