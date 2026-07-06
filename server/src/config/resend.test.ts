import { describe, it, expect } from "vitest";
import { readResendConfig } from "./resend";

describe("readResendConfig", () => {
  it("returns a config when all three vars are present", () => {
    expect(
      readResendConfig({
        RESEND_API_KEY: "re_123",
        FEEDBACK_FROM_EMAIL: "onboarding@resend.dev",
        FEEDBACK_TO_EMAIL: "me@example.com",
      }),
    ).toEqual({
      apiKey: "re_123",
      fromEmail: "onboarding@resend.dev",
      toEmail: "me@example.com",
    });
  });

  it("returns null when any var is missing", () => {
    expect(
      readResendConfig({ RESEND_API_KEY: "re_123", FEEDBACK_TO_EMAIL: "me@example.com" }),
    ).toBeNull();
  });

  it("treats blank/whitespace values as missing", () => {
    expect(
      readResendConfig({
        RESEND_API_KEY: "  ",
        FEEDBACK_FROM_EMAIL: "onboarding@resend.dev",
        FEEDBACK_TO_EMAIL: "me@example.com",
      }),
    ).toBeNull();
  });
});
