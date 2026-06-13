import type { ConnectionState } from "../types/shared";
import type { State } from "./reducer";

// Versioned key: bump the suffix whenever the persisted shape changes in a way
// old data can't satisfy. A mismatched/missing key simply falls back to the
// in-memory initialState — no migration code, no crashes on schema drift.
const STORAGE_KEY = "instalog:state:v1";

const STEPS = ["paste", "preview", "submitting", "results"] as const;
const STATUSES = ["disconnected", "connecting", "connected"] as const;

function isStep(value: unknown): value is State["step"] {
  return typeof value === "string" && (STEPS as readonly string[]).includes(value);
}

function isStatus(value: unknown): value is ConnectionState["status"] {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

// Rebuild the connection slice defensively. The key rule: "connecting" is a
// transient handshake state with no pending promise after a reload — restoring
// it would strand the UI on a spinner forever, so we coerce it back to
// "disconnected". Only a fully-formed "connected" account survives a refresh.
function reviveConnection(raw: unknown, fallback: ConnectionState): ConnectionState {
  if (!raw || typeof raw !== "object") return fallback;
  const conn = raw as Record<string, unknown>;
  if (!isStatus(conn.status)) return fallback;

  if (conn.status === "connected" && conn.account && typeof conn.account === "object") {
    return { status: "connected", account: conn.account as ConnectionState["account"] };
  }
  // "connecting" or a "connected" record with no account → treat as disconnected.
  return { status: "disconnected", account: null };
}

// Reconstruct State field-by-field from untrusted JSON, falling back per-field.
// We read known fields explicitly rather than spreading parsed data, so unknown
// or stale keys can never leak into state.
function reviveState(raw: unknown, fallback: State): State {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;

  return {
    step: isStep(data.step) ? data.step : fallback.step,
    text: typeof data.text === "string" ? data.text : fallback.text,
    parsedResult:
      data.parsedResult && typeof data.parsedResult === "object"
        ? (data.parsedResult as State["parsedResult"])
        : fallback.parsedResult,
    submissionResults: Array.isArray(data.submissionResults)
      ? (data.submissionResults as State["submissionResults"])
      : fallback.submissionResults,
    connection: reviveConnection(data.connection, fallback.connection),
  };
}

// Lazy reducer initializer: useReducer(reducer, initialState, loadState).
export function loadState(fallback: State): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return reviveState(JSON.parse(raw), fallback);
  } catch {
    // Corrupt JSON, disabled storage, private mode — degrade to a fresh session.
    return fallback;
  }
}

// Write effect target. Swallows quota/availability errors: persistence is a
// convenience, never load-bearing.
export function saveState(state: State): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — nothing actionable, keep running.
  }
}
