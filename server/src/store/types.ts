// Persistence ports. The app depends on these interfaces, never on Mongo directly
// — swapping Mongo → Postgres later means new implementations, nothing else changes.

/**
 * Tokens as the app handles them: plaintext in memory, with an ABSOLUTE expiry.
 * The caller converts jira-core's clock-free `expiresInSeconds` into
 * `accessExpiresAt` (Date.now() + expiresInSeconds*1000) before saving.
 * The TokenStore is responsible for encrypting at rest — callers never see ciphertext.
 */
export interface StoredTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly accessExpiresAt: number; // epoch ms
}

export interface TokenStore {
  save(atlassianAccountId: string, tokens: StoredTokens): Promise<void>;
  get(atlassianAccountId: string): Promise<StoredTokens | null>;
  delete(atlassianAccountId: string): Promise<void>;
}

/**
 * A user's profile + the Jira site to act against. Not secret (no encryption),
 * unlike tokens. cloudId keys every Jira API call; name/site feed the UI's account.
 */
export interface StoredUser {
  readonly atlassianAccountId: string;
  readonly name: string;
  readonly email: string;
  readonly cloudId: string;
  readonly site: string;
}

export interface UserStore {
  save(user: StoredUser): Promise<void>;
  get(atlassianAccountId: string): Promise<StoredUser | null>;
  delete(atlassianAccountId: string): Promise<void>;
}

export interface Session {
  readonly sessionId: string;
  readonly atlassianAccountId: string;
  readonly createdAt: number; // epoch ms
  readonly expiresAt: number; // epoch ms
}

export interface SessionStore {
  create(atlassianAccountId: string): Promise<Session>;
  /** Returns null when the session is unknown OR has expired. */
  get(sessionId: string): Promise<Session | null>;
  destroy(sessionId: string): Promise<void>;
}

/**
 * Injected dependencies for a session store. Injecting the clock + id generator
 * keeps sessions deterministic to test (no Date mocking, predictable ids) and
 * keeps the impl free of hidden global state.
 */
export interface SessionStoreDeps {
  readonly now: () => number;
  readonly ttlMs: number;
  readonly generateId: () => string;
}
