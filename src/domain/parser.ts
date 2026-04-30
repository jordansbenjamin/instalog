import type { ParsedDate, ParsedEntry, ParseError, ParseResult, SkippedLine } from "../types/shared";

// const EXAMPLE_INPUT = `29/4/26

// OPS-9 8:45am-9am (going through tasks for the day on Jira)

// CCT-118 9am-10am

// OPS-98 10am-10:08am

// CCT-118 10:08am-12:20pm

// Lunch 12:20pm-12:40pm

// OPS-269 12:40pm-12:55pm (going through Slack messages)

// CCT-118 12:55pm-1:10pm

// C25-2717 1:10pm-3:20pm

// QTA-50 3:30pm-3:50pm (AT catchup with Tenishia)

// C25-2717 3:50pm-4:30pm

// OPS-127 4:30pm-5:10pm (External templates meeting w/ Leon, Jenna, and Marcus)`

const EXAMPLE_INPUT = `29/4/26

OPS-9 8:45am-9am (going through tasks for the day on Jira)

CCT-118 9am-10am`

const EXAMPLE_INPUT_2 = `29/4/26
OPS-9 8:45am-9am (going through tasks for the day on Jira)
CCT-118 9am-10am`

function isValidDate(dateLine: string): boolean {
  // Only supports DD/M/YY for now
  const isValidDateFormat = /^\d{1,2}\/\d{1,2}\/\d{2}$/.test(dateLine);
  const [ day, month ] = dateLine.split('/').map(Number);
  const isValidRange = day >= 1 && day <= 31 && month >= 1 && month <= 12;
  return isValidDateFormat && isValidRange;
}

function extractDateInfo(dateLine: string): ParsedDate {
  const [ day, month, year ] = dateLine.split('/').map(Number);
  return { day, month, year}
}

export function parseTimesheet(input: string): ParseResult | ParseError {
  if (!input || input === '' || typeof input !== "string") {
    return { errorMessage: "Input is empty, please enter timesheet."};
  }

  const lines = input.trim().split('\n');
  let date: ParsedDate | null = null;
  // const entries: ParsedEntry[] = [];
  // const error: ParseError[] = [];
  // const skipped: SkippedLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    if (currentLine.trim() === '') continue;

    // If line is a date, parse and save date then continue
    if (isValidDate(currentLine)) {
      date = extractDateInfo(currentLine);
      continue;
    }

    // If line is a valid entry (a ticket line), grab ticket info
  }

  console.log(lines)
  if (date && entries && errors && skipped) {
    return { date, entries, errors, skipped }
  }
}

parseTimesheet(EXAMPLE_INPUT)
parseTimesheet(EXAMPLE_INPUT_2)