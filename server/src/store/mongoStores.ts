import type { Db } from "mongodb";
import type { TokenCipher } from "../crypto/tokenCipher";
import type {
  Session,
  SessionStore,
  SessionStoreDeps,
  TokenStore,
} from "./types";

// Native-driver implementations behind the store ports. The TokenStore composes
// the cipher so tokens are encrypted at rest; callers only ever see plaintext.

interface TokenDoc {
  atlassianAccountId: string;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  accessExpiresAt: number;
}

export function createMongoTokenStore(db: Db, cipher: TokenCipher): TokenStore {
  const collection = db.collection<TokenDoc>("tokens");
  return {
    async save(atlassianAccountId, tokens) {
      const [accessTokenEnc, refreshTokenEnc] = await Promise.all([
        cipher.encrypt(tokens.accessToken),
        cipher.encrypt(tokens.refreshToken),
      ]);
      await collection.updateOne(
        { atlassianAccountId },
        {
          $set: {
            atlassianAccountId,
            accessTokenEnc,
            refreshTokenEnc,
            accessExpiresAt: tokens.accessExpiresAt,
          },
        },
        { upsert: true },
      );
    },
    async get(atlassianAccountId) {
      const doc = await collection.findOne({ atlassianAccountId });
      if (!doc) {
        return null;
      }
      const [accessToken, refreshToken] = await Promise.all([
        cipher.decrypt(doc.accessTokenEnc),
        cipher.decrypt(doc.refreshTokenEnc),
      ]);
      return { accessToken, refreshToken, accessExpiresAt: doc.accessExpiresAt };
    },
    async delete(atlassianAccountId) {
      await collection.deleteOne({ atlassianAccountId });
    },
  };
}

interface SessionDoc {
  sessionId: string;
  atlassianAccountId: string;
  createdAt: number;
  expiresAt: number;
}

export function createMongoSessionStore(
  db: Db,
  deps: SessionStoreDeps,
): SessionStore {
  const collection = db.collection<SessionDoc>("sessions");
  return {
    async create(atlassianAccountId) {
      const createdAt = deps.now();
      const session: Session = {
        sessionId: deps.generateId(),
        atlassianAccountId,
        createdAt,
        expiresAt: createdAt + deps.ttlMs,
      };
      // Spread so the driver's injected _id can't mutate our returned object.
      await collection.insertOne({ ...session });
      return session;
    },
    async get(sessionId) {
      const doc = await collection.findOne({ sessionId });
      if (!doc || doc.expiresAt <= deps.now()) {
        return null;
      }
      return {
        sessionId: doc.sessionId,
        atlassianAccountId: doc.atlassianAccountId,
        createdAt: doc.createdAt,
        expiresAt: doc.expiresAt,
      };
    },
    async destroy(sessionId) {
      await collection.deleteOne({ sessionId });
    },
  };
}
