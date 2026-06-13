import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { Action, State } from "../state/reducer";
import type { ParsedDate, ParsedEntry, SubmissionResult } from "../types/shared";
import { transformTimesheet } from "../domain/transformer";
import { formatDuration } from "../domain/format";
import { realJiraAdapter } from "../integration/jira/realJiraAdapter";
import { fakeJiraAdapter } from "../integration/jira/fakeJiraAdapter";

export type LogRowState = "pending" | "ok" | "err";

// A line in the live submission log — transient view feed (timestamps + human
// messages), distinct from the authoritative SubmissionResult[] in the reducer.
export interface SubmissionLogRow {
  state: LogRowState;
  ticket: string;
  time: string;
  message: string;
}

interface SubmissionView {
  log: SubmissionLogRow[];
  progress: number; // 0–100
}

// A small settle so the final ✓/× is visible before the step auto-advances.
const FINISH_PAUSE_MS = 280;

function timestamp(): string {
  const now = new Date();
  const pad = (value: number, width = 2) => value.toString().padStart(width, "0");
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
}

function resolveLastPending(
  rows: SubmissionLogRow[],
  state: LogRowState,
  message: string,
): SubmissionLogRow[] {
  const index = rows.map((row) => row.state).lastIndexOf("pending");
  if (index < 0) return rows;
  const next = rows.slice();
  next[index] = { ...next[index], state, message, time: timestamp() };
  return next;
}

// Drives a single submission run: transform → POST each entry through the
// selected adapter → record results. Runs outside React's render, dispatching
// into the reducer and pushing log rows as it goes. Every state mutation is
// gated on `signal.aborted` so an unmount (or StrictMode double-mount) can't
// post twice or update a dead component.
async function runSubmission(
  entries: ParsedEntry[],
  date: ParsedDate,
  isDemo: boolean,
  dispatch: Dispatch<Action>,
  signal: AbortSignal,
  setLog: Dispatch<SetStateAction<SubmissionLogRow[]>>,
  setProgress: Dispatch<SetStateAction<number>>,
): Promise<void> {
  const adapter = isDemo ? fakeJiraAdapter : realJiraAdapter;
  const worklogs = transformTimesheet(entries, date);

  for (let i = 0; i < worklogs.length; i++) {
    if (signal.aborted) return;
    const entry = entries[i];

    setLog((prev) => [
      ...prev,
      { state: "pending", ticket: entry.ticketId, time: timestamp(), message: `POST /worklog for ${entry.ticketId}` },
    ]);

    let submission: SubmissionResult;
    try {
      submission = await adapter.submit(worklogs[i], signal);
    } catch (error) {
      if (signal.aborted) return;
      submission = {
        ok: false,
        ticketId: entry.ticketId,
        kind: "unknown",
        message: error instanceof Error ? error.message : "Unexpected error while submitting.",
        retryable: true,
      };
    }
    if (signal.aborted) return;

    const minutes = entry.endMinutes - entry.startMinutes;
    const message = submission.ok
      ? `201 · ${entry.ticketId} · ${formatDuration(minutes)} logged`
      : `${submission.status ?? "ERR"} · ${entry.ticketId} · rejected`;
    setLog((prev) => resolveLastPending(prev, submission.ok ? "ok" : "err", message));
    setProgress(Math.round(((i + 1) / worklogs.length) * 100));
    dispatch({ type: "SUBMISSION_RESULT", index: i, submissionResult: submission });
  }

  if (signal.aborted) return;
  await new Promise((resolve) => setTimeout(resolve, FINISH_PAUSE_MS));
  if (signal.aborted) return;
  dispatch({ type: "SUBMIT_ENDED" });
}

// Called by SubmittingStep, which only exists while step === "submitting".
// `entries`/`date`/`isDemo` are referentially stable for the whole run (the
// reducer preserves `parsedResult` when it writes results), so the effect fires
// exactly once on mount and aborts on unmount.
export function useSubmission(state: State, dispatch: Dispatch<Action>): SubmissionView {
  const [log, setLog] = useState<SubmissionLogRow[]>([]);
  const [progress, setProgress] = useState(0);

  const result = state.parsedResult;
  const ready = result && result.success ? result : null;
  const entries = ready ? ready.entries : null;
  const date = ready ? ready.date : null;
  const isDemo = state.connection.account?.isDemo ?? false;

  useEffect(() => {
    if (!entries || !date || entries.length === 0) {
      dispatch({ type: "SUBMIT_ENDED" });
      return;
    }
    const controller = new AbortController();
    void runSubmission(entries, date, isDemo, dispatch, controller.signal, setLog, setProgress);
    return () => controller.abort();
  }, [entries, date, isDemo, dispatch]);

  return { log, progress };
}
