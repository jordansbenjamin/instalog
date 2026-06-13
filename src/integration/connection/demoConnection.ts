import type { Account } from "../../types/shared";
import type { ConnectionService } from "./ConnectionService";

// The demo account. `isDemo: true` is the flag that, at submission time, makes
// Seam 2 pick the fake Jira adapter so nothing is ever sent to a real Jira.
const DEMO_ACCOUNT: Account = {
  name: "Demo User",
  site: "demo.instalog.app",
  initials: "DE",
  isDemo: true,
};

// Demo is a permanent product path, not just a dev shim — it survives into
// production unchanged. So it's its own implementation of the same port rather
// than a branch inside the real one. Connecting is instant; there's nothing to
// authorize, so the abort signal is irrelevant here.
export const demoConnection: ConnectionService = {
  async connect(): Promise<Account> {
    return DEMO_ACCOUNT;
  },
  async disconnect(): Promise<void> {
    // Nothing to tear down.
  },
};
