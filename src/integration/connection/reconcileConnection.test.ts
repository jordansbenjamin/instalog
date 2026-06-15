import { describe, it, expect } from "vitest";
import type { Account, ConnectionState } from "../../types/shared";
import { reconcileConnection } from "./reconcileConnection";

const realAccount: Account = {
  name: "Maddy Chen",
  site: "graphite.atlassian.net",
  initials: "MC",
  isDemo: false,
};
const demoAccount: Account = {
  name: "Demo User",
  site: "demo.instalog.app",
  initials: "DU",
  isDemo: true,
};
const disconnected: ConnectionState = { status: "disconnected", account: null };
const connectedReal: ConnectionState = { status: "connected", account: realAccount };
const connectedDemo: ConnectionState = { status: "connected", account: demoAccount };

describe("reconcileConnection", () => {
  it("connects to the /me account whenever the server reports a session", () => {
    expect(reconcileConnection(disconnected, realAccount)).toEqual({
      type: "connect",
      account: realAccount,
    });
  });

  it("/me wins even over a stale persisted demo state", () => {
    expect(reconcileConnection(connectedDemo, realAccount)).toEqual({
      type: "connect",
      account: realAccount,
    });
  });

  it("drops a stale persisted real connection when /me reports nothing", () => {
    expect(reconcileConnection(connectedReal, null)).toEqual({ type: "disconnect" });
  });

  it("leaves a persisted demo connection untouched when /me reports nothing", () => {
    expect(reconcileConnection(connectedDemo, null)).toEqual({ type: "none" });
  });

  it("does nothing when already disconnected and /me reports nothing", () => {
    expect(reconcileConnection(disconnected, null)).toEqual({ type: "none" });
  });
});
