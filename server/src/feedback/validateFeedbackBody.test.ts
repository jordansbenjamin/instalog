import { describe, it, expect } from "vitest";
import { validateFeedbackBody } from "./validateFeedbackBody";

const context = {
  step: "paste",
  isDemo: true,
  appVersion: "1.4.0",
  userAgent: "jsdom",
  url: "http://localhost/",
  submittedAt: "2026-07-05T10:00:00.000Z",
};

describe("validateFeedbackBody", () => {
  it("accepts a valid bug body and trims the message", () => {
    const result = validateFeedbackBody({ type: "bug", message: "  broken  ", context });
    expect(result).toEqual({
      ok: true,
      value: { type: "bug", message: "broken", email: undefined, honeypot: "", context },
    });
  });

  it("rejects an unknown type", () => {
    expect(validateFeedbackBody({ type: "praise", message: "hi", context }).ok).toBe(false);
  });

  it("rejects an empty message", () => {
    expect(validateFeedbackBody({ type: "idea", message: "   ", context }).ok).toBe(false);
  });

  it("rejects a message over 5000 chars", () => {
    const result = validateFeedbackBody({ type: "bug", message: "x".repeat(5001), context });
    expect(result.ok).toBe(false);
  });

  it("rejects a malformed email", () => {
    const result = validateFeedbackBody({ type: "bug", message: "hi", email: "nope", context });
    expect(result.ok).toBe(false);
  });

  it("passes the honeypot value through when present", () => {
    const result = validateFeedbackBody({ type: "bug", message: "hi", honeypot: "bot", context });
    expect(result.ok && result.value.honeypot).toBe("bot");
  });
});
