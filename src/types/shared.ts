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