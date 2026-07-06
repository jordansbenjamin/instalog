import type { FeedbackPayload } from "../../types/shared";

const FEEDBACK_URL = "/api/feedback";

export type FeedbackSendResult = { ok: true } | { ok: false; message: string };

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

// POSTs the report to the backend (same-origin). Mirrors realJiraAdapter: a
// network failure becomes a typed result, but an abort is rethrown so the caller
// can distinguish a cancelled submit from a real failure.
export async function sendFeedback(
  payload: FeedbackPayload,
  signal?: AbortSignal,
): Promise<FeedbackSendResult> {
  let response: Response;
  try {
    response = await fetch(FEEDBACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) {
      throw error;
    }
    return { ok: false, message: "Couldn't reach the server. Check your connection and try again." };
  }

  if (response.ok) {
    return { ok: true };
  }

  if (response.status === 503) {
    return { ok: false, message: "Feedback isn't set up on this server yet." };
  }
  if (response.status === 429) {
    return { ok: false, message: "Too many reports just now. Please wait a moment." };
  }

  let serverMessage: string | undefined;
  try {
    serverMessage = ((await response.json()) as { message?: string }).message;
  } catch {
    serverMessage = undefined;
  }
  return { ok: false, message: serverMessage ?? `Something went wrong (${response.status}).` };
}
