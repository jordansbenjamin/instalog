import { reducer, initialState } from "./reducer";
import type { Account, ParsedEntry, ParseResult, SubmissionResult } from "../types/shared";
import { describe, expect, it } from "vitest";

type State = ReturnType<typeof reducer>;

// Helpers to build test fixtures cleanly
const makeEntry = (ticketId: string): ParsedEntry => ({
  lineNumber: 1,
  ticketId,
  startMinutes: 540,
  endMinutes: 600,
});

const makeParseResult = (entries: ParsedEntry[]): ParseResult => ({
  success: true,
  date: { year: 2026, month: 5, day: 12 },
  entries,
  lines: [],
});

const makeSuccess = (ticketId: string): SubmissionResult => ({
  ok: true,
  ticketId,
});

const makeFailure = (ticketId: string): SubmissionResult => ({
  ok: false,
  ticketId,
  kind: "server",
  status: 500,
  message: "Internal server error",
  retryable: true,
});

const makeAccount = (overrides: Partial<Account> = {}): Account => ({
  name: "Maddy Chen",
  site: "graphite.atlassian.net",
  initials: "MC",
  isDemo: false,
  ...overrides,
});

// Overrides only the fields you care about for a given test
const withState = (overrides: Partial<State>): State => ({
  ...initialState,
  ...overrides,
});

// Safely access entries from a successful parsedResult in tests
const getEntries = (state: State): ParsedEntry[] => {
  if (!state.parsedResult || !state.parsedResult.success) {
    throw new Error("Expected a successful parsedResult");
  }
  return state.parsedResult.entries;
};

// ---------------------------------------------------------------------------
// TEXT_CHANGED
// ---------------------------------------------------------------------------

describe("TEXT_CHANGED", () => {
  it("updates text with the new text", () => {
    const state = reducer(initialState, { type: "TEXT_CHANGED", text: "ABC-1 9am-10am" });
    expect(state.text).toBe("ABC-1 9am-10am");
  });
});

// ---------------------------------------------------------------------------
// PARSE_RESULT
// ---------------------------------------------------------------------------

describe("PARSE_RESULT", () => {
  it("stores the parsed result", () => {
    const entries = [makeEntry("ABC-1"), makeEntry("ABC-2")];
    const parsedResult = makeParseResult(entries);
    const state = reducer(initialState, { type: "PARSE_RESULT", parsedResult });
    expect(state.parsedResult).toEqual(parsedResult);
  });

  it("advances step to preview", () => {
    const parsedResult = makeParseResult([]);
    const state = reducer(initialState, { type: "PARSE_RESULT", parsedResult });
    expect(state.step).toBe("preview");
  });
});

// ---------------------------------------------------------------------------
// EDIT_ENTRY
// ---------------------------------------------------------------------------

describe("EDIT_ENTRY", () => {
  it("applies the patch to the entry at the given index", () => {
    const state = reducer(
      withState({ parsedResult: makeParseResult([makeEntry("ABC-1"), makeEntry("ABC-2")]) }),
      { type: "EDIT_ENTRY", index: 0, patch: { ticketId: "ABC-99" } }
    );
    expect(getEntries(state)[0].ticketId).toBe("ABC-99");
  });

  it("does not affect entries at other indices", () => {
    const state = reducer(
      withState({ parsedResult: makeParseResult([makeEntry("ABC-1"), makeEntry("ABC-2")]) }),
      { type: "EDIT_ENTRY", index: 0, patch: { ticketId: "ABC-99" } }
    );
    expect(getEntries(state)[1].ticketId).toBe("ABC-2");
  });

  it("does not mutate the original entry object", () => {
    const original = makeEntry("ABC-1");
    const before = withState({ parsedResult: makeParseResult([original]) });
    reducer(before, { type: "EDIT_ENTRY", index: 0, patch: { ticketId: "ABC-99" } });
    expect(original.ticketId).toBe("ABC-1");
  });

  it("returns state unchanged when parsedResult is null", () => {
    const state = reducer(
      withState({ parsedResult: null }),
      { type: "EDIT_ENTRY", index: 0, patch: { ticketId: "ABC-99" } }
    );
    expect(state.parsedResult).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// DELETE_ENTRY
// ---------------------------------------------------------------------------

describe("DELETE_ENTRY", () => {
  it("removes the entry at the given index", () => {
    const state = reducer(
      withState({ parsedResult: makeParseResult([makeEntry("ABC-1"), makeEntry("ABC-2"), makeEntry("ABC-3")]) }),
      { type: "DELETE_ENTRY", index: 1 }
    );
    expect(getEntries(state).map((e) => e.ticketId)).toEqual(["ABC-1", "ABC-3"]);
  });

  it("does not mutate the entries array", () => {
    const entries = [makeEntry("ABC-1"), makeEntry("ABC-2")];
    const before = withState({ parsedResult: makeParseResult(entries) });
    reducer(before, { type: "DELETE_ENTRY", index: 0 });
    expect(entries).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// RESTORE_ENTRY
// ---------------------------------------------------------------------------

describe("RESTORE_ENTRY", () => {
  it("re-inserts the entry at the given index", () => {
    const restored = makeEntry("ABC-2");
    const state = reducer(
      withState({ parsedResult: makeParseResult([makeEntry("ABC-1"), makeEntry("ABC-3")]) }),
      { type: "RESTORE_ENTRY", index: 1, entry: restored }
    );
    expect(getEntries(state).map((e) => e.ticketId)).toEqual(["ABC-1", "ABC-2", "ABC-3"]);
  });

  it("round-trips with DELETE_ENTRY back to the original order", () => {
    const before = withState({
      parsedResult: makeParseResult([makeEntry("ABC-1"), makeEntry("ABC-2"), makeEntry("ABC-3")]),
    });
    const removed = getEntries(before)[1];
    const afterDelete = reducer(before, { type: "DELETE_ENTRY", index: 1 });
    const afterRestore = reducer(afterDelete, { type: "RESTORE_ENTRY", index: 1, entry: removed });
    expect(getEntries(afterRestore).map((e) => e.ticketId)).toEqual(["ABC-1", "ABC-2", "ABC-3"]);
  });

  it("appends when the index is at the end", () => {
    const state = reducer(
      withState({ parsedResult: makeParseResult([makeEntry("ABC-1")]) }),
      { type: "RESTORE_ENTRY", index: 1, entry: makeEntry("ABC-2") }
    );
    expect(getEntries(state).map((e) => e.ticketId)).toEqual(["ABC-1", "ABC-2"]);
  });

  it("returns state unchanged when parsedResult is null", () => {
    const state = reducer(
      withState({ parsedResult: null }),
      { type: "RESTORE_ENTRY", index: 0, entry: makeEntry("ABC-1") }
    );
    expect(state.parsedResult).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// BACK
// ---------------------------------------------------------------------------

describe("BACK", () => {
  it("moves from preview back to paste", () => {
    const state = reducer(withState({ step: "preview" }), { type: "BACK" });
    expect(state.step).toBe("paste");
  });

  it("clears parsedResult when going back from preview", () => {
    const state = reducer(
      withState({ step: "preview", parsedResult: makeParseResult([makeEntry("ABC-1")]) }),
      { type: "BACK" }
    );
    expect(state.parsedResult).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SUBMIT_STARTED
// ---------------------------------------------------------------------------

describe("SUBMIT_STARTED", () => {
  it("sets step to submitting", () => {
    const state = reducer(withState({ step: "preview" }), { type: "SUBMIT_STARTED" });
    expect(state.step).toBe("submitting");
  });
});

// ---------------------------------------------------------------------------
// SUBMISSION_RESULT
// ---------------------------------------------------------------------------

describe("SUBMISSION_RESULT", () => {
  it("stores the result at the given index", () => {
    const result = makeSuccess("ABC-1");
    const state = reducer(
      withState({ parsedResult: makeParseResult([makeEntry("ABC-1"), makeEntry("ABC-2")]) }),
      { type: "SUBMISSION_RESULT", index: 0, submissionResult: result }
    );
    expect(state.submissionResults[0]).toEqual(result);
  });

  it("does not overwrite results at other indices", () => {
    const first = makeSuccess("ABC-1");
    const before = withState({
      parsedResult: makeParseResult([makeEntry("ABC-1"), makeEntry("ABC-2")]),
      submissionResults: [first],
    });
    const state = reducer(before, {
      type: "SUBMISSION_RESULT",
      index: 1,
      submissionResult: makeFailure("ABC-2"),
    });
    expect(state.submissionResults[0]).toEqual(first);
  });

  it("can store a result at index 2 even when submissionResults is empty", () => {
    const state = reducer(
      withState({ parsedResult: makeParseResult([makeEntry("A"), makeEntry("B"), makeEntry("C")]) }),
      { type: "SUBMISSION_RESULT", index: 2, submissionResult: makeSuccess("C") }
    );
    expect(state.submissionResults[2]).toBeDefined();
    expect(state.submissionResults[0]).toBeUndefined();
    expect(state.submissionResults[1]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// SUBMIT_ENDED
// ---------------------------------------------------------------------------

describe("SUBMIT_ENDED", () => {
  it("sets step to results", () => {
    const state = reducer(withState({ step: "submitting" }), { type: "SUBMIT_ENDED" });
    expect(state.step).toBe("results");
  });
});

// ---------------------------------------------------------------------------
// RETRY_SUBMISSION
// ---------------------------------------------------------------------------

describe("RETRY_SUBMISSION", () => {
  it("re-enters the submitting step", () => {
    const state = reducer(
      withState({
        step: "results",
        submissionResults: [makeSuccess("ABC-1"), makeFailure("ABC-2")],
      }),
      { type: "RETRY_SUBMISSION" }
    );
    expect(state.step).toBe("submitting");
  });

  it("preserves submissionResults so index alignment with entries holds", () => {
    // The old bug filtered out failures, collapsing the array. Now the results
    // are left intact (the loop re-posts only non-ok slots in place).
    const results = [makeSuccess("ABC-1"), makeFailure("ABC-2"), makeSuccess("ABC-3")];
    const state = reducer(
      withState({ step: "results", submissionResults: results }),
      { type: "RETRY_SUBMISSION" }
    );
    expect(state.submissionResults).toEqual(results);
    expect(state.submissionResults).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// RESET
// ---------------------------------------------------------------------------

describe("RESET", () => {
  it("clears the wizard back to a blank paste step", () => {
    const state = reducer(
      withState({
        step: "results",
        text: "stale text",
        parsedResult: makeParseResult([makeEntry("ABC-1")]),
        submissionResults: [makeSuccess("ABC-1")],
      }),
      { type: "RESET" }
    );
    expect(state.step).toBe("paste");
    expect(state.text).toBe("");
    expect(state.parsedResult).toBeNull();
    expect(state.submissionResults).toEqual([]);
  });

  it("preserves the connection — start over keeps you connected", () => {
    const connection = { status: "connected" as const, account: makeAccount() };
    const state = reducer(
      withState({ step: "results", submissionResults: [makeSuccess("ABC-1")], connection }),
      { type: "RESET" }
    );
    expect(state.connection).toEqual(connection);
  });
});

// ---------------------------------------------------------------------------
// CONNECT_STARTED
// ---------------------------------------------------------------------------

describe("CONNECT_STARTED", () => {
  it("moves the connection into the connecting state with no account", () => {
    const state = reducer(initialState, { type: "CONNECT_STARTED" });
    expect(state.connection).toEqual({ status: "connecting", account: null });
  });

  it("does not touch the wizard slice", () => {
    const before = withState({ step: "preview", text: "draft" });
    const state = reducer(before, { type: "CONNECT_STARTED" });
    expect(state.step).toBe("preview");
    expect(state.text).toBe("draft");
  });
});

// ---------------------------------------------------------------------------
// CONNECT_SUCCEEDED
// ---------------------------------------------------------------------------

describe("CONNECT_SUCCEEDED", () => {
  it("stores the account and marks the connection connected", () => {
    const account = makeAccount();
    const state = reducer(
      withState({ connection: { status: "connecting", account: null } }),
      { type: "CONNECT_SUCCEEDED", account }
    );
    expect(state.connection).toEqual({ status: "connected", account });
  });

  it("carries the isDemo flag through on the account", () => {
    const account = makeAccount({ name: "Demo User", site: "demo.instalog.app", initials: "DE", isDemo: true });
    const state = reducer(initialState, { type: "CONNECT_SUCCEEDED", account });
    expect(state.connection.account?.isDemo).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// DISCONNECT
// ---------------------------------------------------------------------------

describe("DISCONNECT", () => {
  it("clears the connection back to disconnected", () => {
    const state = reducer(
      withState({ connection: { status: "connected", account: makeAccount() } }),
      { type: "DISCONNECT" }
    );
    expect(state.connection).toEqual({ status: "disconnected", account: null });
  });

  it("preserves the wizard's in-progress work", () => {
    const parsedResult = makeParseResult([makeEntry("ABC-1")]);
    const before = withState({
      step: "preview",
      text: "ABC-1 9am-10am",
      parsedResult,
      connection: { status: "connected", account: makeAccount() },
    });
    const state = reducer(before, { type: "DISCONNECT" });
    expect(state.step).toBe("preview");
    expect(state.text).toBe("ABC-1 9am-10am");
    expect(state.parsedResult).toEqual(parsedResult);
  });
});
