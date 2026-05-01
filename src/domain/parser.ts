import type { ParsedDate, ParsedEntry, ParseError, ParseResult } from "../types/shared";

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

function isValidTicketEntry(entryLine: string): boolean {
  return /^[A-Z]+-\d+/.test(entryLine);
}

function convertTimeToMinutes(time: string) {
  const [hour, minute] = time.split(":").map(num => parseInt(num, 10));
  let convertedHour = hour;
  
  if ((time.includes("am") && hour === 12) || (time.includes("pm") && hour !== 12)) {
    convertedHour = hour + 12;
  }

  if (!minute) return convertedHour * 60;
  
  const convertedTime = (convertedHour * 60) + minute;
  return convertedTime;
}

export function parseTimesheet(input: string): ParseResult | ParseError {
  if (!input || input === '' || typeof input !== "string") {
    return { errorMessage: "Input is empty, please add a timesheet."};
  }

  const lines = input.trim().split('\n');
  
  const dateLine = lines.find(line => isValidDate(line.trim()));
  if (!dateLine) return { errorMessage: "No date found, please add a date"};
  const date: ParsedDate = extractDateInfo(dateLine);

  const entries: ParsedEntry[] = [];
  // const errors: ParseError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    // If line is blank
    if (currentLine === '') continue;

    if (isValidDate(currentLine)) continue;

    // skipped line
    if (!isValidTicketEntry(currentLine)) {
      continue;
    }

    const [ ticketId, timePeriod, description] = currentLine.split(' ');

    // if (!isValidTimePeriod(timePeriod)) {
    //   // TBD
    // }
    // if (!isValidDescription(description)) {
    //   // TBD
    // }

    const [startTime, endTime] = timePeriod.split("-");
    const startMinutes = convertTimeToMinutes(startTime);
    const endMinutes = convertTimeToMinutes(endTime);

    let parsedDescription;
    if (description?.startsWith("(") && description?.endsWith(")")) {
      parsedDescription = description.slice(1,description.length-1)
    }

    const validEntry = {
      lineNumber: i+1,
      ticketId,
      startMinutes,
      endMinutes,
      description: parsedDescription,
    }

    entries.push(validEntry);
  }

  return { date, entries}
}

console.log(parseTimesheet(EXAMPLE_INPUT))
console.log(parseTimesheet(EXAMPLE_INPUT_2))