import { describe, it, expect } from "vitest";
import { needsRefresh, ACCESS_TOKEN_REFRESH_SKEW_MS } from "./needsRefresh";

// The spec for the proactive-refresh predicate. The skew constant is fixed here;
// the tests assert behaviour relative to it, so the predicate's *logic* is what's
// under test, not the buffer size.
describe("needsRefresh", () => {
  const expiresAt = 1_000_000;

  it("is false when the token is valid well beyond the skew window", () => {
    expect(needsRefresh(expiresAt, expiresAt - ACCESS_TOKEN_REFRESH_SKEW_MS - 1000)).toBe(false);
  });

  it("is false just before the skew window opens", () => {
    expect(needsRefresh(expiresAt, expiresAt - ACCESS_TOKEN_REFRESH_SKEW_MS - 1)).toBe(false);
  });

  it("is true at the moment the skew window opens", () => {
    expect(needsRefresh(expiresAt, expiresAt - ACCESS_TOKEN_REFRESH_SKEW_MS)).toBe(true);
  });

  it("is true once inside the skew window (expiring soon)", () => {
    expect(needsRefresh(expiresAt, expiresAt - ACCESS_TOKEN_REFRESH_SKEW_MS + 1)).toBe(true);
  });

  it("is true when the token is already expired", () => {
    expect(needsRefresh(expiresAt, expiresAt + 1)).toBe(true);
  });
});
