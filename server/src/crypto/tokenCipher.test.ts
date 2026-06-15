import { describe, it, expect } from "vitest";
import { createTokenCipher } from "./tokenCipher";

// 32-char ASCII strings → 32-byte AES-256 keys, base64-encoded.
const KEY_A = btoa("0123456789abcdef0123456789abcdef");
const KEY_B = btoa("ABCDEFGHIJKLMNOPQRSTUVWXYZ012345");

describe("createTokenCipher", () => {
  it("rejects a key that is not 32 bytes", () => {
    expect(() => createTokenCipher(btoa("too-short"))).toThrow();
  });
});

describe("encrypt / decrypt round-trip", () => {
  const cipher = createTokenCipher(KEY_A);

  it("decrypts back to the original plaintext", async () => {
    const secret = "atlassian-refresh-token-value";
    const decrypted = await cipher.decrypt(await cipher.encrypt(secret));
    expect(decrypted).toBe(secret);
  });

  it("produces ciphertext that is not the plaintext", async () => {
    const encrypted = await cipher.encrypt("plaintext-token");
    expect(encrypted).not.toContain("plaintext-token");
  });

  it("uses a fresh IV so the same plaintext encrypts differently each time", async () => {
    const [a, b] = await Promise.all([
      cipher.encrypt("same-value"),
      cipher.encrypt("same-value"),
    ]);
    expect(a).not.toBe(b);
  });
});

describe("authentication (GCM)", () => {
  const cipher = createTokenCipher(KEY_A);

  it("rejects ciphertext that has been tampered with", async () => {
    const encrypted = await cipher.encrypt("token");
    // Flip the last base64 char to corrupt the auth tag.
    const tampered =
      encrypted.slice(0, -2) + (encrypted.at(-2) === "A" ? "B" : "A") + "=";
    await expect(cipher.decrypt(tampered)).rejects.toThrow();
  });

  it("cannot decrypt ciphertext produced with a different key", async () => {
    const encrypted = await cipher.encrypt("token");
    const otherCipher = createTokenCipher(KEY_B);
    await expect(otherCipher.decrypt(encrypted)).rejects.toThrow();
  });
});
