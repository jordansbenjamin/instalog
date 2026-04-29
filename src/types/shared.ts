export interface ParsedDate {
  year: number;
  month: number;
  day: number;
}
export interface ParsedEntry {
  lineNumber: number;
  ticketId: string;
  startTime: string;
  endTime: string;
  description?: string;
}

export interface ParseError {
  lineNumber: number;
  rawLine: string;
  errorMessage: string;
}

export interface SkippedLine {
  lineNumber: number;
  rawLine: string;
}

export interface ParseResult {
  // date: string;
  date: ParsedDate;
  entries: ParsedEntry[];
  errors: ParseError[];
  skipped: SkippedLine[];
}