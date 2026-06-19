import { createServerlessApp } from "../server/src/serverlessApp";

// Vercel entry point. The whole Express app runs as ONE Vercel Function, handling
// every /api/* request (routed here by vercel.json). The SPA is served separately
// and statically by Vercel's CDN from the Vite build — same origin, so the
// httpOnly session cookie stays first-party (no CORS).
//
// Top-level await connects + caches Mongo once per cold start; the resolved app
// is reused across warm invocations.
export default await createServerlessApp();
