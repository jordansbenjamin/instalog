/**
 * Optional feedback-email config. Read separately from `env.ts` so it can be
 * unit-tested without triggering that module's boot-time `loadEnv()` throw.
 * All three vars must be present; otherwise the feedback feature is treated as
 * unconfigured and the endpoint degrades to 503.
 */
export interface ResendConfig {
  readonly apiKey: string;
  readonly fromEmail: string;
  readonly toEmail: string;
}

export function readResendConfig(
  source: Record<string, string | undefined> = process.env,
): ResendConfig | null {
  const apiKey = source.RESEND_API_KEY?.trim();
  const fromEmail = source.FEEDBACK_FROM_EMAIL?.trim();
  const toEmail = source.FEEDBACK_TO_EMAIL?.trim();
  if (!apiKey || !fromEmail || !toEmail) {
    return null;
  }
  return { apiKey, fromEmail, toEmail };
}
