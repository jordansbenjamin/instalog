import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { MongoClient, type Db } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  createMongoTokenStore,
  createMongoSessionStore,
} from "./mongoStores";
import {
  runTokenStoreContract,
  runSessionStoreContract,
} from "./storeContract";
import { createTokenCipher } from "../crypto/tokenCipher";

const cipher = createTokenCipher(btoa("0123456789abcdef0123456789abcdef"));

let mongod: MongoMemoryServer;
let client: MongoClient;
let db: Db;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  client = new MongoClient(mongod.getUri());
  await client.connect();
  db = client.db("test");
}, 120_000); // first run may download the mongod binary

afterAll(async () => {
  await client?.close();
  await mongod?.stop();
});

/** A clean database per store, so contract tests start from empty collections. */
async function freshDb(): Promise<Db> {
  await db.dropDatabase();
  return db;
}

runTokenStoreContract("Mongo", async () =>
  createMongoTokenStore(await freshDb(), cipher),
);

runSessionStoreContract("Mongo", async (deps) =>
  createMongoSessionStore(await freshDb(), deps),
);

describe("Mongo — encryption at rest", () => {
  it("persists ciphertext, never the plaintext tokens", async () => {
    const cleanDb = await freshDb();
    const store = createMongoTokenStore(cleanDb, cipher);
    const tokens = {
      accessToken: "SECRET-ACCESS",
      refreshToken: "SECRET-REFRESH",
      accessExpiresAt: 123,
    };

    await store.save("acc-1", tokens);

    const raw = await cleanDb
      .collection("tokens")
      .findOne({ atlassianAccountId: "acc-1" });
    expect(raw?.accessTokenEnc).not.toContain("SECRET-ACCESS");
    expect(raw?.refreshTokenEnc).not.toContain("SECRET-REFRESH");
    expect(raw).not.toHaveProperty("accessToken");
    expect(raw).not.toHaveProperty("refreshToken");

    // And it still decrypts back through the store.
    expect(await store.get("acc-1")).toEqual(tokens);
  });
});
