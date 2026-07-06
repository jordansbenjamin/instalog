import type { ResendConfig } from "../config/resend.js";

// Context the browser captures at submit time so a report arrives with the
// state it happened in. Accepted as opaque strings — never trusted for logic.
export interface FeedbackContext {
  step: string;
  isDemo: boolean;
  appVersion: string;
  userAgent: string;
  url: string;
  submittedAt: string;
}

export interface FeedbackEmailInput {
  type: "bug" | "idea";
  message: string;
  email?: string;
  context: FeedbackContext;
}

export interface EmailSender {
  send(input: FeedbackEmailInput): Promise<void>;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const SUBJECT_MAX = 60;

// Injecting `fetch` keeps this unit-testable without network — the same seam
// the jira-core uses. NOTE: the Resend field names (to/from/reply_to/text) are
// external and must be verified against live docs before shipping (Task 1.4).
export function createEmailSender(
  config: ResendConfig,
  fetchImpl: typeof fetch = fetch,
): EmailSender {
  return {
    async send(input: FeedbackEmailInput): Promise<void> {
      const response = await fetchImpl(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.fromEmail,
          to: [config.toEmail],
          subject: formatSubject(input),
          text: formatBody(input),
          ...(input.email ? { reply_to: input.email } : {}),
        }),
      });
      if (!response.ok) {
        const detail = await safeText(response);
        throw new Error(`Resend responded ${response.status}: ${detail}`);
      }
    },
  };
}

function formatSubject(input: FeedbackEmailInput): string {
  const label = input.type === "bug" ? "Bug" : "Idea";
  const firstLine = input.message.trim().split("\n")[0] ?? "";
  const snippet =
    firstLine.length > SUBJECT_MAX ? `${firstLine.slice(0, SUBJECT_MAX - 1)}…` : firstLine;
  return `[instalog ${label}] ${snippet}`;
}

function formatBody(input: FeedbackEmailInput): string {
  const { context } = input;
  return [
    `Type: ${input.type}`,
    `Reply-to: ${input.email ?? "(none provided)"}`,
    "",
    input.message.trim(),
    "",
    "— context —",
    `Step: ${context.step}`,
    `Demo: ${context.isDemo}`,
    `Version: ${context.appVersion}`,
    `URL: ${context.url}`,
    `When: ${context.submittedAt}`,
    `Agent: ${context.userAgent}`,
  ].join("\n");
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "(no body)";
  }
}
