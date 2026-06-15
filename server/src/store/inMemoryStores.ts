import type {
  Session,
  SessionStore,
  SessionStoreDeps,
  StoredTokens,
  TokenStore,
} from "./types";

// In-memory implementations: a fast TDD seam and a test double for higher layers.
// RAM is not "at rest", so these hold plaintext — encryption-at-rest is the Mongo
// impl's job. Copies on the way in and out so callers can't mutate stored state.

export function createInMemoryTokenStore(): TokenStore {
  const tokens = new Map<string, StoredTokens>();
  return {
    async save(atlassianAccountId, value) {
      tokens.set(atlassianAccountId, { ...value });
    },
    async get(atlassianAccountId) {
      const value = tokens.get(atlassianAccountId);
      return value ? { ...value } : null;
    },
    async delete(atlassianAccountId) {
      tokens.delete(atlassianAccountId);
    },
  };
}

export function createInMemorySessionStore(
  deps: SessionStoreDeps,
): SessionStore {
  const sessions = new Map<string, Session>();
  return {
    async create(atlassianAccountId) {
      const createdAt = deps.now();
      const session: Session = {
        sessionId: deps.generateId(),
        atlassianAccountId,
        createdAt,
        expiresAt: createdAt + deps.ttlMs,
      };
      sessions.set(session.sessionId, session);
      return { ...session };
    },
    async get(sessionId) {
      const session = sessions.get(sessionId);
      if (!session) {
        return null;
      }
      if (session.expiresAt <= deps.now()) {
        sessions.delete(sessionId);
        return null;
      }
      return { ...session };
    },
    async destroy(sessionId) {
      sessions.delete(sessionId);
    },
  };
}
