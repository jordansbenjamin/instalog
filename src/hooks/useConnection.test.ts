import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useConnection } from "./useConnection";
import type { Account, ConnectionState } from "../types/shared";

const realAccount: Account = {
  name: "Maddy Chen",
  site: "graphite.atlassian.net",
  initials: "MC",
  isDemo: false,
};
const disconnected: ConnectionState = { status: "disconnected", account: null };

function stubMe(account: Account | null): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ account }), { status: 200 })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("useConnection mount hydration", () => {
  it("connects from the /api/me session on mount", async () => {
    stubMe(realAccount);
    const dispatch = vi.fn();

    renderHook(() => useConnection(dispatch, disconnected));

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith({
        type: "CONNECT_SUCCEEDED",
        account: realAccount,
      }),
    );
  });

  it("drops a stale persisted real connection when /api/me is empty", async () => {
    stubMe(null);
    const dispatch = vi.fn();
    const stale: ConnectionState = { status: "connected", account: realAccount };

    renderHook(() => useConnection(dispatch, stale));

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith({ type: "DISCONNECT" }),
    );
  });

  it("does not disconnect a persisted demo session when /api/me is empty", async () => {
    stubMe(null);
    const dispatch = vi.fn();
    const demo: ConnectionState = {
      status: "connected",
      account: { name: "Demo User", site: "demo.instalog.app", initials: "DU", isDemo: true },
    };

    renderHook(() => useConnection(dispatch, demo));

    // Give the mount effect a tick to resolve before asserting no dispatch.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(dispatch).not.toHaveBeenCalled();
  });
});
