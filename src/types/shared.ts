import type { Dispatch } from "react";
import type { generateWorklogADF } from "../domain/transformer";
import type { Action, State } from "../state/reducer";

// Represents a date parsed from the first line of the timesheet (DD/M/YY format).
export interface ParsedDate {
  year: number;
  month: number;
  day: number;
}

// Represents a single timesheet entry with ticket ID and time range.
export interface ParsedEntry {
  lineNumber: number;
  ticketId: string;
  startMinutes: number;
  endMinutes: number;
  description?: string;
}

// ── Live line analysis (for the Paste editor's gutter + highlight) ────────
// Per-line classification the editor renders as gutter markers:
//   date ◆ · ok ✓ · skip ⏵ · err ! · blank (none)
export type LineKind = "date" | "ok" | "skip" | "err" | "blank";

// A coloured segment of a line for the syntax-highlight overlay. The `type` is
// semantic (what the segment *is*); the editor maps it to a colour class. The
// concatenation of every token's `text` reconstructs the raw line exactly —
// which is what keeps the transparent textarea's caret aligned to the overlay.
export type HighlightTokenType = "ticket" | "time" | "comment" | "date" | "skip" | "plain";

export interface HighlightToken {
  text: string;
  type: HighlightTokenType;
}

// Everything the editor needs to render one source line. The parser is the
// brain that produces these; the editor is a pure view over them.
export interface LineInfo {
  kind: LineKind;
  lineNumber: number;
  raw: string;
  tokens: HighlightToken[];
  errorMessage?: string;
}

// ── Jira connection ──────────────────────────────────────────────────────
// A connected Jira (or demo) account. `isDemo` is the single flag that, later,
// selects the fake vs. real Jira adapter at submission time — so demo-ness
// travels as data, not as a separate code path.
export interface Account {
  name: string;
  site: string;
  initials: string;
  isDemo: boolean;
}

// The connection is a tiny state machine: you are either disconnected, mid-
// handshake (connecting), or connected with an account in hand.
export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface ConnectionState {
  status: ConnectionStatus;
  account: Account | null;
}

// The complete result of parsing a timesheet. `lines` is present on BOTH
// variants so the live editor can render its gutter/highlight as you type, even
// before there's a usable date (the failure case). `success` answers the
// separate question "is this ready to advance to Preview?" — true only when a
// date and at least one valid entry are present.
export type ParseResult =
  | { success: true; date: ParsedDate; entries: ParsedEntry[]; lines: LineInfo[] }
  | { success: false; errorMessage: string; lines: LineInfo[] }

export interface JiraWorklog {
  ticketId: string;
  body: ReturnType<typeof generateWorklogADF>
}

export type SubmissionErrorKind =
  | 'auth'        // 401: token is bad
  | 'permission'  // 403: user not allowed on this ticket
  | 'not-found'   // 404: ticket doesn't exist
  | 'server'      // 5xx: Requesting server's problem (jira)
  | 'network'     // fetch threw: network/connectivity issue
  | 'config'      // env vars missing: should not happen at runtime
  | 'unknown'     // catch-all for statuses not recognised

export type SubmissionResult =
  | {
      ok: true;
      ticketId: string;
      worklogId?: string;
    }
  | {
      ok: false;
      ticketId: string;
      kind: SubmissionErrorKind;
      status?: number;
      message: string;
      retryable: boolean;
    }

export interface StepProps {
  state: State;
  dispatch: Dispatch<Action>;
}