import "dotenv/config";

/**
 * Typed, validated environment config — the single boundary where we read raw
 * `process.env` (untrusted strings) and turn it into a strongly-typed `Env`.
 * Validation happens once, at import time, so a misconfigured deploy fails fast
 * at boot with a clear message rather than throwing mid-request.
 */

export type NodeEnv = "development" | "production" | "test";

export interface Env {
  readonly nodeEnv: NodeEnv;
  readonly port: number;
  readonly isProduction: boolean;
  readonly atlassian: {
    readonly clientId: string;
    readonly clientSecret: string;
    readonly redirectUri: string;
  };
  readonly mongoUri: string;
  readonly tokenEncryptionKey: string;
}

// Least-privilege scopes (design doc §Decisions). Constant, not env-configurable.
export const ATLASSIAN_SCOPES: readonly string[] = [
  "read:me",
  "read:jira-work",
  "write:jira-work",
  "offline_access",
];

const DEFAULT_PORT = 3000;
const DEFAULT_NODE_ENV: NodeEnv = "development";
const VALID_NODE_ENVS: readonly NodeEnv[] = ["development", "production", "test"];
const MIN_PORT = 1;
const MAX_PORT = 65535;

function parseNodeEnv(raw: string | undefined): NodeEnv {
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_NODE_ENV;
  }
  if ((VALID_NODE_ENVS as readonly string[]).includes(raw)) {
    return raw as NodeEnv;
  }
  throw new Error(
    `Invalid NODE_ENV "${raw}". Expected one of: ${VALID_NODE_ENVS.join(", ")}.`,
  );
}

/**
 * Parse + validate PORT.
 *
 * Policy choice (the interesting decision here): we REJECT bad values rather than
 * silently clamping them. A clamped port hides a config typo until something else
 * breaks; a thrown error surfaces it immediately at boot. If you'd rather clamp,
 * this is the one function to change.
 */
function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_PORT;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(
      `Invalid PORT "${raw}". Expected an integer between ${MIN_PORT} and ${MAX_PORT}.`,
    );
  }
  return port;
}

/** Require a non-empty env var; fail fast at boot if a deploy is misconfigured. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}.`);
  }
  return value;
}

function loadEnv(): Env {
  const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
  const port = parsePort(process.env.PORT);
  return {
    nodeEnv,
    port,
    isProduction: nodeEnv === "production",
    atlassian: {
      clientId: requireEnv("ATLASSIAN_CLIENT_ID"),
      clientSecret: requireEnv("ATLASSIAN_CLIENT_SECRET"),
      redirectUri: requireEnv("ATLASSIAN_REDIRECT_URI"),
    },
    mongoUri: requireEnv("MONGODB_URI"),
    tokenEncryptionKey: requireEnv("TOKEN_ENCRYPTION_KEY"),
  };
}

export const env: Env = loadEnv();
