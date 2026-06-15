// Opaque, high-entropy session identifier. The cookie holds only this value; the
// session itself lives server-side, looked up by this id. 24 random bytes → 32
// base64url chars. Web Crypto, so it ports anywhere.
const SESSION_ID_BYTES = 24;

export function generateSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SESSION_ID_BYTES));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
