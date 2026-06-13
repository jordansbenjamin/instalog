import type { Account } from "../../types/shared";

// ── Seam 1: the connection port ──────────────────────────────────────────
// The UI depends only on this interface, never on a concrete implementation.
// Today it has two implementations — `simulatedConnection` (a fake OAuth
// handshake) and `demoConnection` (instant sample account). Later, a real
// `atlassianOAuth` implementation drops in behind the same shape with zero
// UI changes. This mirrors Seam 2 (JiraAdapter: real vs. fake submit).
export interface ConnectionService {
  // `connect` resolves with the authenticated account, or rejects with an
  // AbortError if `signal` fires first (the modal's Cancel button). Demo-ness
  // is carried on the returned Account.isDemo — not as a separate method.
  connect(signal?: AbortSignal): Promise<Account>;
  disconnect(): Promise<void>;
}
