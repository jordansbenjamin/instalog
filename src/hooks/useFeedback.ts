import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedbackType, FeedbackContext, FeedbackPayload } from "../types/shared";
import { validateFeedbackInput } from "../domain/feedbackValidation";
import { sendFeedback } from "../integration/feedback/feedbackClient";
import { APP_VERSION } from "../version";

export type FeedbackStatus = "idle" | "sending" | "sent" | "error";

export interface FeedbackFormInput {
  type: FeedbackType;
  message: string;
  email: string;
  honeypot: string;
}

interface AppContext {
  step: string;
  isDemo: boolean;
}

function buildContext(app: AppContext): FeedbackContext {
  return {
    step: app.step,
    isDemo: app.isDemo,
    appVersion: APP_VERSION,
    userAgent: navigator.userAgent,
    url: window.location.href,
    submittedAt: new Date().toISOString(),
  };
}

export function useFeedback(app: AppContext) {
  const [status, setStatus] = useState<FeedbackStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  const submit = useCallback(
    async (input: FeedbackFormInput): Promise<void> => {
      const validation = validateFeedbackInput({
        type: input.type,
        message: input.message,
        email: input.email,
      });
      if (!validation.ok) {
        setStatus("error");
        setError(validation.message);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("sending");
      setError(null);

      const payload: FeedbackPayload = {
        type: input.type,
        message: input.message.trim(),
        email: input.email.trim() || undefined,
        honeypot: input.honeypot,
        context: buildContext(app),
      };

      try {
        const result = await sendFeedback(payload, controller.signal);
        if (result.ok) {
          setStatus("sent");
        } else {
          setStatus("error");
          setError(result.message);
        }
      } catch {
        // Abort (component unmounted / modal closed mid-send) — drop silently.
      }
    },
    [app],
  );

  // Cancel any in-flight request on unmount so a late resolve never setState's
  // an unmounted component.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { status, error, submit, reset };
}
