import { describe, expect, it } from "vitest"
import type { ParsedDate, ParsedEntry } from "../types/shared"
import { parseTimesheet } from "./parser"
import { transformTimesheet } from "./transformer"

function parseOrThrow(input: string): { entries: ParsedEntry[]; date: ParsedDate } {
  const result = parseTimesheet(input);
  if (!result.success) throw new Error(result.errorMessage);
  return { entries: result.entries, date: result.date };
}

describe('transformTimesheet functional related tests', () => {
  it('transforms a single ticket entry', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am`

    const { entries, date } = parseOrThrow(input)
    const transformedTimesheet = transformTimesheet(entries, date);

    expect(transformedTimesheet).toHaveLength(1)
    expect(transformedTimesheet[0].ticketId).toBe('C25-3278')
    expect(transformedTimesheet[0].body.timeSpentSeconds).toBe(2280)
    expect(transformedTimesheet[0].body.started).toBe('2026-03-16T08:40:00.000+1100')
    expect(transformedTimesheet[0].body.comment).toBeUndefined()
  })

  it('handles 12pm correctly (noon edge case)', () => {
    const input = `16/3/26

FDES-13 12pm-12:30pm`

    const { entries, date } = parseOrThrow(input)
    const transformedTimesheet = transformTimesheet(entries, date);

    expect(transformedTimesheet[0].body.started).toBe('2026-03-16T12:00:00.000+1100')
    expect(transformedTimesheet[0].body.timeSpentSeconds).toBe(1800)
  })

  it('handles 12am correctly (midnight edge case)', () => {
    const input = `16/3/26

FDES-13 12am-12:30am`

    const { entries, date } = parseOrThrow(input)
    const transformedTimesheet = transformTimesheet(entries, date);

    expect(transformedTimesheet[0].body.started).toBe('2026-03-16T00:00:00.000+1100')
    expect(transformedTimesheet[0].body.timeSpentSeconds).toBe(1800)
  })

  it('calculates whole-hour PM times correctly', () => {
    const input = `16/3/26

C25-100 1pm-2pm`

    const { entries, date } = parseOrThrow(input)
    const transformedTimesheet = transformTimesheet(entries, date);

    expect(transformedTimesheet[0].body.timeSpentSeconds).toBe(3600)
    expect(transformedTimesheet[0].body.started).toBe('2026-03-16T13:00:00.000+1100')
  })

  it('calculates duration across the AM/PM boundary', () => {
    const input = `16/3/26

C25-101 11:30am-1:00pm`

    const { entries, date } = parseOrThrow(input)
    const transformedTimesheet = transformTimesheet(entries, date);

    expect(transformedTimesheet[0].body.timeSpentSeconds).toBe(5400)
    expect(transformedTimesheet[0].body.started).toBe('2026-03-16T11:30:00.000+1100')
  })

  it('includes ADF comment structure when description is provided', () => {
    const input = `16/3/26

C25-200 9am-10am fixed login bug`

    const { entries, date } = parseOrThrow(input)
    const transformedTimesheet = transformTimesheet(entries, date);

    expect(transformedTimesheet[0].body.comment).toMatchObject({
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "fixed login bug" }
          ]
        }
      ]
    })
  })

  it('transforms multiple entries on the same day', () => {
    const input = `16/3/26

C25-1 9am-10am
C25-2 10am-11am
C25-3 11am-12pm`

    const { entries, date } = parseOrThrow(input)
    const transformedTimesheet = transformTimesheet(entries, date);

    expect(transformedTimesheet).toHaveLength(3)
    expect(transformedTimesheet.map(t => t.ticketId)).toEqual(['C25-1', 'C25-2', 'C25-3'])
    expect(transformedTimesheet[0].body.started).toBe('2026-03-16T09:00:00.000+1100')
    expect(transformedTimesheet[1].body.started).toBe('2026-03-16T10:00:00.000+1100')
    expect(transformedTimesheet[2].body.started).toBe('2026-03-16T11:00:00.000+1100')
    expect(transformedTimesheet[0].body.timeSpentSeconds).toBe(3600)
    expect(transformedTimesheet[1].body.timeSpentSeconds).toBe(3600)
    expect(transformedTimesheet[2].body.timeSpentSeconds).toBe(3600)
  })

  it('excludes LUNCH and MAKEUP entries from transformed output', () => {
    const input = `16/3/26

C25-1 9am-10am
LUNCH 12pm-1pm
C25-2 2pm-3pm
MAKEUP 5pm-6pm`

    const { entries, date } = parseOrThrow(input)
    const transformedTimesheet = transformTimesheet(entries, date);

    expect(transformedTimesheet).toHaveLength(2)
    expect(transformedTimesheet.map(t => t.ticketId)).toEqual(['C25-1', 'C25-2'])
  })
})