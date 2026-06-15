// Persistence layer barrel. The shell wires the Mongo impls in production and can
// swap the in-memory impls in tests/dev — both satisfy the same contract.
export type {
  StoredTokens,
  TokenStore,
  StoredUser,
  UserStore,
  Session,
  SessionStore,
  SessionStoreDeps,
} from "./types";
export {
  createInMemoryTokenStore,
  createInMemoryUserStore,
  createInMemorySessionStore,
} from "./inMemoryStores";
export {
  createMongoTokenStore,
  createMongoUserStore,
  createMongoSessionStore,
} from "./mongoStores";
