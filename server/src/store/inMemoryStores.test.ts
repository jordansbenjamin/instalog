import {
  createInMemoryTokenStore,
  createInMemorySessionStore,
} from "./inMemoryStores";
import {
  runTokenStoreContract,
  runSessionStoreContract,
} from "./storeContract";

runTokenStoreContract("InMemory", async () => createInMemoryTokenStore());

runSessionStoreContract("InMemory", async (deps) =>
  createInMemorySessionStore(deps),
);
