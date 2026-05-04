import type { ParsedDate, ParsedEntry } from "../types/shared";

export function generateWorklogADF(timeSpent: number, timeStarted: string, descriptionText?: string) {
  const bodyData = {
    timeSpentSeconds: timeSpent,
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

export function transformTimesheet(entries: ParsedEntry[], date: ParsedDate) {
  
}