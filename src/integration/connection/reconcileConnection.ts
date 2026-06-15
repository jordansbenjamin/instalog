import type { Account, ConnectionState } from "../../types/shared";

// On load, two sources disagree about whether we're connected: the persisted
// localStorage slice and the server session (GET /api/me). For a REAL connection
// the server is authoritative; a persisted demo connection is purely client-side
// and the server knows nothing about it. This decides which dispatch (if any) the
// load-time hydration should make — kept pure so it's trivially testable.
export type ReconcileAction =
  | { type: "connect"; account: Account }
  | { type: "disconnect" }
  | { type: "none" };

export function reconcileConnection(
  persisted: ConnectionState,
  meAccount: Account | null,
): ReconcileAction {
  if (meAccount) {
    return { type: "connect", account: meAccount };
  }
  // No server session. Only a stale REAL connection needs correcting; a demo
  // connection lives entirely client-side, so leave it alone.
  const isStaleReal =
    persisted.status === "connected" &&
    persisted.account !== null &&
    !persisted.account.isDemo;
  return isStaleReal ? { type: "disconnect" } : { type: "none" };
}
