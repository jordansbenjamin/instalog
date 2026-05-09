import type { generateWorklogADF } from "../domain/transformer";

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

// type LineKind = "date" | "ok" | "skip" | "err" | "blank";

// interface LineInfo {
//   lineKind: LineKind;
//   lineNumber: number;
//   rawLine?: string;
//   errorMessage?: string;
// }

// The complete result of parsing a timesheet, including entries, errors, and skipped lines.
export type ParseResult = 
  | { success: true; date: ParsedDate; entries: ParsedEntry[];} 
  | { success: false; errorMessage: string}

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
      worklogId: string;
    }
  | {
      ok: false;
      ticketId: string;
      kind: SubmissionErrorKind;
      status?: number;
      message: string;
      retryable: boolean;
    }