import { describe, it, expect, beforeEach } from "vitest";
import type {
  SessionStore,
  SessionStoreDeps,
  StoredTokens,
  TokenStore,
} from "./types";

// One behavioural contract, run against every TokenStore/SessionStore
// implementation. If the in-memory and Mongo impls both pass the same suite,
// they're interchangeable behind the interface — which is the whole point.

const SAMPLE: StoredTokens = {
  accessToken: "access-token-value",
  refreshToken: "refresh-token-value",
  accessExpiresAt: 1_700_000_000_000,
};

export function runTokenStoreContract(
  name: string,
  makeStore: () => Promise<TokenStore>,
): void {
  describe(`${name} — TokenStore contract`, () => {
    let store: TokenStore;
    beforeEach(async () => {
      store = await makeStore();
    });

    it("returns null for an unknown account", async () => {
      expect(await store.get("unknown")).toBeNull();
    });

    it("saves tokens and reads them back unchanged", async () => {
      await store.save("acc-1", SAMPLE);
      expect(await store.get("acc-1")).toEqual(SAMPLE);
    });

    it("upserts: a second save for the same account overwrites the first", async () => {
      await store.save("acc-1", SAMPLE);
      const updated: StoredTokens = {
        accessToken: "rotated-access",
        refreshToken: "rotated-refresh",
        accessExpiresAt: 1_700_000_999_000,
      };
      await store.save("acc-1", updated);
      expect(await store.get("acc-1")).toEqual(updated);
    });

    it("deletes tokens", async () => {
      await store.save("acc-1", SAMPLE);
      await store.delete("acc-1");
      expect(await store.get("acc-1")).toBeNull();
    });

    it("treats delete of a missing account as a no-op", async () => {
      await expect(store.delete("ghost")).resolves.toBeUndefined();
    });
  });
}

export function runSessionStoreContract(
  name: string,
  makeStore: (deps: SessionStoreDeps) => Promise<SessionStore>,
): void {
  describe(`${name} — SessionStore contract`, () => {
    const TTL_MS = 1000;
    let clock: number;
    let counter: number;
    let store: SessionStore;

    beforeEach(async () => {
      clock = 10_000;
      counter = 0;
      store = await makeStore({
        now: () => clock,
        ttlMs: TTL_MS,
        generateId: () => `sid-${++counter}`,
      });
    });

    it("creates a session with id, account, and ttl-based expiry", async () => {
      const session = await store.create("acc-1");
      expect(session).toEqual({
        sessionId: "sid-1",
        atlassianAccountId: "acc-1",
        createdAt: 10_000,
        expiresAt: 11_000,
      });
    });

    it("reads back a live session", async () => {
      const session = await store.create("acc-1");
      expect(await store.get(session.sessionId)).toEqual(session);
    });

    it("returns null for an unknown session id", async () => {
      expect(await store.get("missing")).toBeNull();
    });

    it("returns null once the session has expired", async () => {
      const session = await store.create("acc-1");
      clock += TTL_MS + 1;
      expect(await store.get(session.sessionId)).toBeNull();
    });

    it("destroys a session", async () => {
      const session = await store.create("acc-1");
      await store.destroy(session.sessionId);
      expect(await store.get(session.sessionId)).toBeNull();
    });
  });
}
