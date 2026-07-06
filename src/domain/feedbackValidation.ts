import type { FeedbackType } from "../types/shared";

export interface FeedbackInput {
  type: FeedbackType;
  message: string;
  email: string;
}

export type FeedbackInputResult = { ok: true } | { ok: false; message: string };

const MAX_MESSAGE = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pure UX-side validation for the form. The server re-validates independently
// as the real trust boundary.
export function validateFeedbackInput(input: FeedbackInput): FeedbackInputResult {
  const message = input.message.trim();
  if (message.length < 1) {
    return { ok: false, message: "Please describe the bug or idea." };
  }
  if (message.length > MAX_MESSAGE) {
    return { ok: false, message: `Keep it under ${MAX_MESSAGE} characters.` };
  }
  const email = input.email.trim();
  if (email !== "" && !EMAIL_RE.test(email)) {
    return { ok: false, message: "That email doesn't look right." };
  }
  return { ok: true };
}
