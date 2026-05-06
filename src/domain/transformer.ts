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

function calculateTimeStarted(startMinutes: number, date: ParsedDate) {
  // TBD
}

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