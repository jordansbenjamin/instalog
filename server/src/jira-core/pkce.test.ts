import { describe, it, expect } from "vitest";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "./pkce";

const BASE64URL = /^[A-Za-z0-9_-]+$/;

describe("generateCodeVerifier", () => {
  it("returns a base64url string of RFC-compliant length (43..128)", () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(BASE64URL);
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it("produces a different value on each call", () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier());
  });
});

describe("generateCodeChallenge", () => {
  // RFC 7636 Appendix B known-answer vector: this pins our S256 implementation
  // to the spec, not to itself.
  it("derives the S256 challenge for the RFC 7636 reference verifier", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("returns a base64url string with no padding", () => {
    const challenge = generateCodeChallenge("any-verifier-value");
    return challenge.then((value) => {
      expect(value).toMatch(BASE64URL);
      expect(value).not.toContain("=");
    });
  });
});

describe("generateState", () => {
  it("returns a base64url string", () => {
    expect(generateState()).toMatch(BASE64URL);
  });

  it("produces a different value on each call", () => {
    expect(generateState()).not.toBe(generateState());
  });
});
