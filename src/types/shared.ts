interface ParsedEntry {
  lineNumber: number;
  ticketId: string;
  startTime: string;
  endTime: string;
  workDescription?: string;
}

interface ParseError {
  lineNumber: number;
}

interface SkippedLine {
  lineNumber: number;
}

export interface ParsedTimesheet {
  date: string;
  entries: ParsedEntry[];
  errors: ParseError[];
  skipped: SkippedLine[];
}