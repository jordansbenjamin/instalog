import {
  createInMemoryTokenStore,
  createInMemorySessionStore,
  createInMemoryUserStore,
} from "./inMemoryStores";
import {
  runTokenStoreContract,
  runSessionStoreContract,
  runUserStoreContract,
} from "./storeContract";

runTokenStoreContract("InMemory", async () => createInMemoryTokenStore());

runUserStoreContract("InMemory", async () => createInMemoryUserStore());

runSessionStoreContract("InMemory", async (deps) =>
  createInMemorySessionStore(deps),
);
