import { describe, it, expect } from "vitest";
import { generateSessionId } from "./sessionId";

describe("generateSessionId", () => {
  it("returns a base64url token", () => {
    expect(generateSessionId()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("is long enough to resist guessing (>= 32 chars)", () => {
    expect(generateSessionId().length).toBeGreaterThanOrEqual(32);
  });

  it("is unique across calls", () => {
    expect(generateSessionId()).not.toBe(generateSessionId());
  });
});
