// PKCE (RFC 7636) + CSRF state helpers for the OAuth authorize round-trip.
// Uses Web Crypto (globalThis.crypto) — not node:crypto — so this module ports
// verbatim to any runtime with the web standard (Node, browsers, edge).

const VERIFIER_BYTES = 32; // 32 random bytes → 43-char base64url (RFC range 43..128)
const STATE_BYTES = 16;

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** A high-entropy PKCE code_verifier (base64url, no padding). */
export function generateCodeVerifier(): string {
  return randomBase64Url(VERIFIER_BYTES);
}

/** The S256 code_challenge = base64url(SHA-256(verifier)). */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

/** An opaque random value used to bind the authorize request to its callback (CSRF). */
export function generateState(): string {
  return randomBase64Url(STATE_BYTES);
}
