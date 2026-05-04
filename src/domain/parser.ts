import type { ParsedDate, ParsedEntry, ParseResult } from "../types/shared";

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
  return /^[A-Z][A-Z0-9]*-\d+/.test(entryLine);
}

function convertTimeToMinutes(time: string) {
  const [hour, minute] = time.split(":").map(num => parseInt(num, 10));
  let convertedHour = hour;
  
  if (time.includes("pm") && hour !== 12) {
    convertedHour = hour + 12;
  }

  if (time.includes("am") && hour === 12) {
    convertedHour = hour - 12;
  }

  if (!minute) return convertedHour * 60;
  
  const convertedTime = (convertedHour * 60) + minute;
  return convertedTime;
}

export function parseTimesheet(input: string): ParseResult {
  if (!input.trim()) {
    return { success: false, errorMessage: "Input is empty, please add a timesheet."};
  }

  const lines = input.trim().split('\n');
  
  const firstNonBlankLine = lines.find(line => line.trim() !== '')?.trim();

  if (!firstNonBlankLine || !isValidDate(firstNonBlankLine)) {
    return { success: false, errorMessage: "No date found, please add a date"};
  }
  
  const date: ParsedDate = extractDateInfo(firstNonBlankLine);

  // return error if lines is date only (no entries)
  if (lines.length === 1 && isValidDate(firstNonBlankLine)) {
    return { success: false, errorMessage: "No date ticket entry added, please add a ticket entry"};
  }

  const entries: ParsedEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i+1;
    const currentLine = lines[i].trim();
    // If line is blank
    if (currentLine === '') continue;

    if (isValidDate(currentLine)) continue;

    // skipped line
    if (!isValidTicketEntry(currentLine)) {
      continue;
    }

    const [ ticketId, timePeriod, ...descriptionParts] = currentLine.split(' ');
    const description = descriptionParts.join(' ');

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
      lineNumber,
      ticketId,
      startMinutes,
      endMinutes,
      description: parsedDescription
    }
    
    entries.push(validEntry);
  }

  return { success: true, date, entries}
}
