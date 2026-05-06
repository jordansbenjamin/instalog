import type { JiraWorklog, ParsedDate, ParsedEntry } from "../types/shared";

export function generateWorklogADF(durationInSeconds: number, timeStarted: string, descriptionText?: string) {
  const bodyData = {
    timeSpentSeconds: durationInSeconds,
    started: timeStarted,
    // NOTE: Could be more explicit with ...(descriptionText !== undefined && descriptionText !== "" ? { comment: { ... } } : {})
    ...(descriptionText && {
      comment: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: descriptionText
              }
            ]
          }
        ]
      }
    })
  }

  return bodyData;
}

function calculateTimeStarted(startMinutes: number, date: ParsedDate): string {
  // "2026-03-18T19:00:00.000+1000"
  const hour = Math.floor(startMinutes / 60);
  const minute = startMinutes % 60;
  const yearStr = `${date.year + 2000}`;
  const monthStr = `${date.month}`.padStart(2, '0');
  const dayStr = `${date.day}`.padStart(2, '0');

  const isoString = `${yearStr}-${monthStr}-${dayStr}T${hour}:${minute}:00.000+1000`;
  console.log(isoString)
  return isoString;
}

calculateTimeStarted(1170, {day: 8, month: 3, year: 26})
calculateTimeStarted(1168, {day: 18, month: 3, year: 26})

export function transformTimesheet(entries: ParsedEntry[], date: ParsedDate): JiraWorklog[] {
  // if (entries.length < 1) return;
  const transformedEntries: JiraWorklog[] = entries.map(entry => {
    // if (!entry) return;
    const { ticketId, startMinutes, endMinutes, description } = entry;
    // timeSpent is duration in seconds
    const durationInSeconds = (endMinutes - startMinutes) * 60;
    // timeStarted is UTC
    const timeStarted = calculateTimeStarted(startMinutes, date);

    const body = generateWorklogADF(durationInSeconds, timeStarted, description)

    return { ticketId, body }
  });

  return transformedEntries;
}