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

function extractDurationInSeconds() {}

export function transformTimesheet(entries: ParsedEntry[], date: ParsedDate): JiraWorklog[] {
  // if (entries.length < 1) return;
  const transformedEntries: JiraWorklog[] = entries.map(entry => {
    // if (!entry) return;
    const { ticketId, startMinutes, endMinutes, description } = entry;
    // timeSpent is duration in seconds
    const durationInSeconds = extractDurationInSeconds(startMinutes, endMinutes);
    // timeStarted is UTC
    const timeStarted = extractTimeStartedUTC()

    const body = generateWorklogADF(durationInSeconds, timeStarted, description)

    return { ticketId, body }
  });

  return transformedEntries;
}