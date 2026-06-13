import type { Account } from "../../types/shared";
import type { ConnectionService } from "./ConnectionService";

// The account a successful "real" connect resolves to. Stand-in for whatever
// Atlassian's accessible-resources endpoint will return in Phase 8.
const REAL_ACCOUNT: Account = {
  name: "Maddy Chen",
  site: "graphite.atlassian.net",
  initials: "MC",
  isDemo: false,
};

// How long the fake OAuth round-trip "takes". Long enough to show the
// connecting spinner and let the user hit Cancel.
const SIMULATED_OAUTH_MS = 1700;

// An abortable delay. Resolves after `ms`, or rejects with a standard
// AbortError the moment `signal` fires — and always detaches its listener so
// nothing leaks. This is the same cancellation contract `fetch` uses, which is
// why the real OAuth adapter will be a drop-in later.
function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export const simulatedConnection: ConnectionService = {
  async connect(signal?: AbortSignal): Promise<Account> {
    await abortableDelay(SIMULATED_OAUTH_MS, signal);
    return REAL_ACCOUNT;
  },
  async disconnect(): Promise<void> {
    // No server session to tear down in the simulation.
  },
};
