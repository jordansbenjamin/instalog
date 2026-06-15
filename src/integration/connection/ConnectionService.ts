import type { Account } from "../../types/shared";

// ── Seam 1: the connection port ──────────────────────────────────────────
// The UI depends only on this interface, never on a concrete implementation.
// Two implementations slot in behind it — `atlassianConnection` (real Sign-in-
// with-Atlassian OAuth, a full-page redirect) and `demoConnection` (instant
// sample account). This mirrors Seam 2 (JiraAdapter: real vs. fake submit).
//
// Note: the real connect() redirects rather than resolving, so connected state
// is hydrated from the server session via getCurrentAccount() (GET /api/me) on
// load — see useConnection. demo resolves an account synchronously.
export interface ConnectionService {
  // `connect` resolves with the authenticated account, or rejects with an
  // AbortError if `signal` fires first (the modal's Cancel button). Demo-ness
  // is carried on the returned Account.isDemo — not as a separate method.
  connect(signal?: AbortSignal): Promise<Account>;
  disconnect(): Promise<void>;
}
