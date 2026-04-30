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

// Represents a line that failed to parse with error details.
export interface ParseError {
  lineNumber?: number;
  rawLine?: string;
  errorMessage: string;
}

// Represents a line that was intentionally skipped (e.g., Lunch, Makeup).
export interface SkippedLine {
  lineNumber: number;
  rawLine: string;
}

// type LineKind = "date" | "ok" | "skip" | "err" | "blank";

// interface LineInfo {
//   lineKind: LineKind;
// }

// The complete result of parsing a timesheet, including entries, errors, and skipped lines.
export interface ParseResult {
  date: ParsedDate;
  entries: ParsedEntry[];
  errors: ParseError[];
  skipped: SkippedLine[];
  // lineInfo: LineInfo[];
}