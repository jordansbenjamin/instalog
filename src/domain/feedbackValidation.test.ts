import { describe, it, expect } from "vitest";
import { validateFeedbackInput } from "./feedbackValidation";

describe("validateFeedbackInput", () => {
  it("accepts a non-empty message with no email", () => {
    expect(validateFeedbackInput({ type: "bug", message: "It broke", email: "" })).toEqual({
      ok: true,
    });
  });

  it("rejects an empty/whitespace message", () => {
    expect(validateFeedbackInput({ type: "idea", message: "   ", email: "" }).ok).toBe(false);
  });

  it("rejects a message over 5000 characters", () => {
    expect(
      validateFeedbackInput({ type: "bug", message: "x".repeat(5001), email: "" }).ok,
    ).toBe(false);
  });

  it("accepts a valid optional email", () => {
    expect(
      validateFeedbackInput({ type: "bug", message: "hi", email: "a@b.co" }).ok,
    ).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(validateFeedbackInput({ type: "bug", message: "hi", email: "nope" }).ok).toBe(false);
  });
});
