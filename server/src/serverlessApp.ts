import { MongoClient, type Db } from "mongodb";
import type { Express } from "express";
import { env } from "./config/env";
import { buildApp } from "./app";
import { createApiRouterForDb } from "./wiring";

// Serverless shell for Vercel. Unlike index.ts (a long-lived server that calls
// app.listen), this exports a ready Express app for Vercel to invoke per request.
//
// The Mongo connection is cached at MODULE scope so warm invocations of the same
// function instance reuse one pooled connection instead of dialing Atlas on every
// request (which would exhaust the connection limit). maxPoolSize is kept small
// because Vercel may run many parallel instances, each with its own pool.
let dbPromise: Promise<Db> | null = null;

function getDb(): Promise<Db> {
  if (!dbPromise) {
    const client = new MongoClient(env.mongoUri, { maxPoolSize: 10 });
    dbPromise = client.connect().then((connected) => connected.db());
  }
  return dbPromise;
}

export async function createServerlessApp(): Promise<Express> {
  const db = await getDb();
  return buildApp({ apiRouter: createApiRouterForDb(db) });
}
