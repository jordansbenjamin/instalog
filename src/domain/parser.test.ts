import { describe, it, expect } from 'vitest'
import { parseTimesheet } from './parser'
import type { ParseResult } from '../types/shared'

function assertSuccess(result: ParseResult) {
  if (!result.success) throw new Error(`Expected success, got error: ${result.errorMessage}`);
  return result;
}

describe('parseTimesheet functional related tests', () => {
  it('parses a single ticket entry', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.date).toEqual({ year: 26, month: 3, day: 16 })
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].ticketId).toBe('C25-3278')
    expect(result.entries[0].startMinutes).toBe(520) // 8:40am
    expect(result.entries[0].endMinutes).toBe(558)   // 9:18am
    expect(result.entries[0].description).toBeUndefined()
  })

  it('parses multiple ticket entries', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am

CCT-77 9:18am-10am

OPS-1 10am-10:30am

OPS-449 10:30am-10:37am

FDES-13 10:37am-12:35pm

Lunch 12:35pm-1:15pm

CCT-77 1:15pm-2:38pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.date).toEqual({ year: 26, month: 3, day: 16 })
    expect(result.entries).toHaveLength(6)

    expect(result.entries[0].ticketId).toBe('C25-3278')
    expect(result.entries[0].startMinutes).toBe(520) // 8:40am
    expect(result.entries[0].endMinutes).toBe(558)   // 9:18am
    expect(result.entries[0].description).toBeUndefined()

    expect(result.entries[5].ticketId).toBe('CCT-77')
    expect(result.entries[5].startMinutes).toBe(795) // 1:15pm
    expect(result.entries[5].endMinutes).toBe(878)   // 2:38pm
    expect(result.entries[5].description).toBeUndefined()
  })

  it('parses a ticket entry with description', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am (test description)`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.date).toEqual({ year: 26, month: 3, day: 16 })
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].ticketId).toBe('C25-3278')
    expect(result.entries[0].startMinutes).toBe(520)
    expect(result.entries[0].endMinutes).toBe(558)
    expect(result.entries[0].description).toBe('test description')
  })

  it('parses description with multiple words', () => {
    const input = `16/3/26

FDES-13 3:28pm-3:50pm (Helping Vivian w/ Flinders)`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].ticketId).toBe('FDES-13')
    expect(result.entries[0].startMinutes).toBe(928) // 3:28pm
    expect(result.entries[0].endMinutes).toBe(950)   // 3:50pm
    expect(result.entries[0].description).toBe('Helping Vivian w/ Flinders')
  })

  it('skips lunch entries', () => {
    const input = `16/3/26

FDES-13 10:37am-12:35pm

Lunch 12:35pm-1:15pm

CCT-77 1:15pm-2:38pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].ticketId).toBe('FDES-13')
    expect(result.entries[1].ticketId).toBe('CCT-77')
    // TODO: assert result.skipped once skipped line tracking is implemented
    // expect(result.skipped).toHaveLength(1)
    // expect(result.skipped[0].rawLine).toBe('Lunch 12:35pm-1:15pm')
  })

  it('handles duplicate ticket IDs as separate entries', () => {
    const input = `16/3/26

CCT-77 9:18am-10am

CCT-77 1:15pm-2:38pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].ticketId).toBe('CCT-77')
    expect(result.entries[0].startMinutes).toBe(558) // 9:18am
    expect(result.entries[1].ticketId).toBe('CCT-77')
    expect(result.entries[1].startMinutes).toBe(795) // 1:15pm
  })

  it('handles entries with no blank lines between them', () => {
    const input = `16/3/26
C25-3278 8:40am-9:18am
CCT-77 9:18am-10am`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].ticketId).toBe('C25-3278')
    expect(result.entries[1].ticketId).toBe('CCT-77')
  })

  it('skips makeup time entries', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am

Makeup 5pm-5:30pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].ticketId).toBe('C25-3278')
    // TODO: assert result.skipped once skipped line tracking is implemented
    // expect(result.skipped).toHaveLength(1)
    // expect(result.skipped[0].rawLine).toBe('Makeup 5pm-5:30pm')
  })
})

describe('parseTimesheet time conversion tests', () => {
  it('converts 12pm (noon) as start time to 720 minutes', () => {
    const input = `16/3/26
OPS-9 12pm-1pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries[0].startMinutes).toBe(720) // 12pm = noon
    expect(result.entries[0].endMinutes).toBe(780)   // 1pm
  })

  it('converts 12:30pm to 750 minutes', () => {
    const input = `16/3/26
OPS-9 12:30pm-1pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries[0].startMinutes).toBe(750) // 12:30pm
    expect(result.entries[0].endMinutes).toBe(780)   // 1pm
  })

  it('handles a time entry spanning noon (am start, pm end)', () => {
    const input = `16/3/26
OPS-9 11:30am-12:30pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries[0].startMinutes).toBe(690) // 11:30am
    expect(result.entries[0].endMinutes).toBe(750)   // 12:30pm
  })

  it('converts 12am (midnight) to 0 minutes', () => {
    const input = `16/3/26
OPS-9 12am-1am`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries[0].startMinutes).toBe(0)   // 12am = midnight
    expect(result.entries[0].endMinutes).toBe(60)    // 1am
  })

  it('converts 9:00am start and 9:00pm end correctly', () => {
    const input = `16/3/26
OPS-9 9:00am-9:00pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries[0].startMinutes).toBe(540)  // 9:00am = 9 * 60
    expect(result.entries[0].endMinutes).toBe(1260)   // 9:00pm = 21 * 60
  })
})

describe('parseTimesheet error handling tests', () => {
  it('returns failure when input is empty', () => {
    const result = parseTimesheet('')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errorMessage).toBe('Input is empty, please add a timesheet.')
    }
  })

  it('returns failure when input has no date', () => {
    const result = parseTimesheet('C25-3278 8:40am-9:18am')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errorMessage).toBe('No date found, please add a date')
    }
  })

  it('returns failure when input is whitespace only', () => {
    const result = parseTimesheet('   ')

    expect(result.success).toBe(false)
  })

  it('returns failure when input is newlines only', () => {
    const result = parseTimesheet('\n\n\n')

    expect(result.success).toBe(false)
  })
})

// TODO: implement when per-line error and skipped tracking is added to the parser
// describe('parseTimesheet classification tests', () => {
//   it('records parse errors with line number and raw line', () => {
//     const input = `16/3/26
//
// C25-3278 8:40am-9:18am
// BAD-1 not-a-time`
//
//     const result = assertSuccess(parseTimesheet(input))
//
//     expect(result.errors).toHaveLength(1)
//     expect(result.errors[0].lineNumber).toBe(4)
//     expect(result.errors[0].rawLine).toBe('BAD-1 not-a-time')
//   })
//
//   it('records skipped lines with line number and raw line', () => {
//     const input = `16/3/26
//
// C25-3278 8:40am-9:18am
// Lunch 12:35pm-1:15pm`
//
//     const result = assertSuccess(parseTimesheet(input))
//
//     expect(result.skipped).toHaveLength(1)
//     expect(result.skipped[0].lineNumber).toBe(4)
//     expect(result.skipped[0].rawLine).toBe('Lunch 12:35pm-1:15pm')
//   })
//
//   it('classifies MAKEUP as skipped (not an error)', () => {
//     const input = `16/3/26
// Makeup 5pm-5:30pm`
//
//     const result = assertSuccess(parseTimesheet(input))
//
//     expect(result.skipped).toHaveLength(1)
//     expect(result.skipped[0].rawLine).toBe('Makeup 5pm-5:30pm')
//     expect(result.errors).toHaveLength(0)
//   })
//
//   it('classifies non-ticket first words as skipped even with a valid time range', () => {
//     const input = `16/3/26
// FooBar 9am-10am`
//
//     const result = assertSuccess(parseTimesheet(input))
//
//     expect(result.skipped).toHaveLength(1)
//     expect(result.entries).toHaveLength(0)
//     expect(result.errors).toHaveLength(0)
//   })
// })
