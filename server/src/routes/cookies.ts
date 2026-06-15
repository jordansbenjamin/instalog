import type { CookieOptions } from "express";

// Cookie names + option builders. The session cookie holds only an opaque session
// id (the secret is the id itself, looked up server-side); the PKCE cookie holds
// the encrypted { state, codeVerifier } during the authorize round-trip.
export const SESSION_COOKIE = "instalog_session";
export const PKCE_COOKIE = "instalog_pkce";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PKCE_TTL_MS = 10 * 60 * 1000; // 10 minutes — only spans the consent redirect

// httpOnly: never readable by JS (XSS-safe). SameSite=Lax: sent on the top-level
// callback redirect but not cross-site POSTs. Secure only in prod (localhost is http).
export function sessionCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

export function pkceCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: PKCE_TTL_MS,
  };
}
