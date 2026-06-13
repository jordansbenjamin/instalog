import type { Account } from "../../types/shared";
import { abortableDelay } from "../../lib/abortableDelay";
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

export const simulatedConnection: ConnectionService = {
  async connect(signal?: AbortSignal): Promise<Account> {
    await abortableDelay(SIMULATED_OAUTH_MS, signal);
    return REAL_ACCOUNT;
  },
  async disconnect(): Promise<void> {
    // No server session to tear down in the simulation.
  },
};
