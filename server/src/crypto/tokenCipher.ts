// AES-256-GCM encryption for tokens at rest. Web Crypto (crypto.subtle) so it
// ports to any runtime. GCM is authenticated: decrypt() throws if the ciphertext
// was tampered with or the wrong key is used — a corrupted token errors loudly
// rather than returning garbage.

const KEY_BYTES = 32; // AES-256
const IV_BYTES = 12; // GCM standard 96-bit nonce

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  // Back the array with a concrete ArrayBuffer so the type is Uint8Array<ArrayBuffer>
  // (what Web Crypto's BufferSource expects), not the wider ArrayBufferLike.
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface TokenCipher {
  encrypt(plaintext: string): Promise<string>;
  decrypt(payload: string): Promise<string>;
}

/**
 * Build a cipher bound to a base64-encoded 32-byte key. The key is imported once
 * (cached promise) and reused across calls. Ciphertext is base64(iv ‖ cipherText+tag).
 */
export function createTokenCipher(keyBase64: string): TokenCipher {
  const rawKey = base64ToBytes(keyBase64);
  if (rawKey.length !== KEY_BYTES) {
    throw new Error(
      `Token encryption key must be ${KEY_BYTES} bytes; got ${rawKey.length}.`,
    );
  }

  const keyPromise = crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );

  async function encrypt(plaintext: string): Promise<string> {
    const key = await keyPromise;
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const cipherText = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(plaintext),
      ),
    );
    const combined = new Uint8Array(iv.length + cipherText.length);
    combined.set(iv, 0);
    combined.set(cipherText, iv.length);
    return bytesToBase64(combined);
  }

  async function decrypt(payload: string): Promise<string> {
    const key = await keyPromise;
    const combined = base64ToBytes(payload);
    const iv = combined.subarray(0, IV_BYTES);
    const cipherText = combined.subarray(IV_BYTES);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherText,
    );
    return new TextDecoder().decode(plaintext);
  }

  return { encrypt, decrypt };
}
