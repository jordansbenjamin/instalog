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

ACME-4126 8:40am-9:18am`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.date).toEqual({ year: 26, month: 3, day: 16 })
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].ticketId).toBe('ACME-4126')
    expect(result.entries[0].startMinutes).toBe(520) // 8:40am
    expect(result.entries[0].endMinutes).toBe(558)   // 9:18am
    expect(result.entries[0].description).toBeUndefined()
  })

  it('parses multiple ticket entries', () => {
    const input = `16/3/26

ACME-4126 8:40am-9:18am

WEB-204 9:18am-10am

PLAT-58 10am-10:30am

CORE-449 10:30am-10:37am

DSN-92 10:37am-12:35pm

Lunch 12:35pm-1:15pm

WEB-204 1:15pm-2:38pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.date).toEqual({ year: 26, month: 3, day: 16 })
    expect(result.entries).toHaveLength(6)

    expect(result.entries[0].ticketId).toBe('ACME-4126')
    expect(result.entries[0].startMinutes).toBe(520) // 8:40am
    expect(result.entries[0].endMinutes).toBe(558)   // 9:18am
    expect(result.entries[0].description).toBeUndefined()

    expect(result.entries[5].ticketId).toBe('WEB-204')
    expect(result.entries[5].startMinutes).toBe(795) // 1:15pm
    expect(result.entries[5].endMinutes).toBe(878)   // 2:38pm
    expect(result.entries[5].description).toBeUndefined()
  })

  it('parses a ticket entry with description', () => {
    const input = `16/3/26

ACME-4126 8:40am-9:18am (test description)`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.date).toEqual({ year: 26, month: 3, day: 16 })
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].ticketId).toBe('ACME-4126')
    expect(result.entries[0].startMinutes).toBe(520)
    expect(result.entries[0].endMinutes).toBe(558)
    expect(result.entries[0].description).toBe('test description')
  })

  it('parses description with multiple words', () => {
    const input = `16/3/26

DSN-92 3:28pm-3:50pm (Helping Sam w/ Horizon)`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].ticketId).toBe('DSN-92')
    expect(result.entries[0].startMinutes).toBe(928) // 3:28pm
    expect(result.entries[0].endMinutes).toBe(950)   // 3:50pm
    expect(result.entries[0].description).toBe('Helping Sam w/ Horizon')
  })

  it('skips lunch entries', () => {
    const input = `16/3/26

DSN-92 10:37am-12:35pm

Lunch 12:35pm-1:15pm

WEB-204 1:15pm-2:38pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].ticketId).toBe('DSN-92')
    expect(result.entries[1].ticketId).toBe('WEB-204')
    // TODO: assert result.skipped once skipped line tracking is implemented
    // expect(result.skipped).toHaveLength(1)
    // expect(result.skipped[0].rawLine).toBe('Lunch 12:35pm-1:15pm')
  })

  it('handles duplicate ticket IDs as separate entries', () => {
    const input = `16/3/26

WEB-204 9:18am-10am

WEB-204 1:15pm-2:38pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].ticketId).toBe('WEB-204')
    expect(result.entries[0].startMinutes).toBe(558) // 9:18am
    expect(result.entries[1].ticketId).toBe('WEB-204')
    expect(result.entries[1].startMinutes).toBe(795) // 1:15pm
  })

  it('handles entries with no blank lines between them', () => {
    const input = `16/3/26
ACME-4126 8:40am-9:18am
WEB-204 9:18am-10am`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].ticketId).toBe('ACME-4126')
    expect(result.entries[1].ticketId).toBe('WEB-204')
  })

  it('skips makeup time entries', () => {
    const input = `16/3/26

ACME-4126 8:40am-9:18am

Makeup 5pm-5:30pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].ticketId).toBe('ACME-4126')
    // TODO: assert result.skipped once skipped line tracking is implemented
    // expect(result.skipped).toHaveLength(1)
    // expect(result.skipped[0].rawLine).toBe('Makeup 5pm-5:30pm')
  })
})

describe('parseTimesheet time conversion tests', () => {
  it('converts 12pm (noon) as start time to 720 minutes', () => {
    const input = `16/3/26
PLAT-140 12pm-1pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries[0].startMinutes).toBe(720) // 12pm = noon
    expect(result.entries[0].endMinutes).toBe(780)   // 1pm
  })

  it('converts 12:30pm to 750 minutes', () => {
    const input = `16/3/26
PLAT-140 12:30pm-1pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries[0].startMinutes).toBe(750) // 12:30pm
    expect(result.entries[0].endMinutes).toBe(780)   // 1pm
  })

  it('handles a time entry spanning noon (am start, pm end)', () => {
    const input = `16/3/26
PLAT-140 11:30am-12:30pm`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries[0].startMinutes).toBe(690) // 11:30am
    expect(result.entries[0].endMinutes).toBe(750)   // 12:30pm
  })

  it('converts 12am (midnight) to 0 minutes', () => {
    const input = `16/3/26
PLAT-140 12am-1am`

    const result = assertSuccess(parseTimesheet(input))

    expect(result.entries[0].startMinutes).toBe(0)   // 12am = midnight
    expect(result.entries[0].endMinutes).toBe(60)    // 1am
  })

  it('converts 9:00am start and 9:00pm end correctly', () => {
    const input = `16/3/26
PLAT-140 9:00am-9:00pm`

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
    const result = parseTimesheet('ACME-4126 8:40am-9:18am')

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

  it('marks a reversed time range as a per-line error instead of failing fatally', () => {
    const result = parseTimesheet(`16/3/26\n\nDEMO-100 10am-9am`)

    const errLine = result.lines.find((line) => line.kind === 'err')
    expect(errLine?.lineNumber).toBe(3)
    expect(errLine?.errorMessage).toMatch(/after start time/i)
    // the only entry was invalid, so the parse still can't advance
    expect(result.success).toBe(false)
  })

  it('marks an equal start/end time as a per-line error', () => {
    const result = parseTimesheet(`16/3/26\n\nDEMO-100 9am-9am`)

    expect(result.lines.find((line) => line.kind === 'err')?.lineNumber).toBe(3)
    expect(result.success).toBe(false)
  })

  it('keeps the valid entries when a different line errors', () => {
    const result = parseTimesheet(`16/3/26\n\nACME-4126 8:40am-9:18am\nBAD-1 10am-9am`)

    const result2 = assertSuccess(result)
    expect(result2.entries).toHaveLength(1)
    expect(result2.entries[0].ticketId).toBe('ACME-4126')
    expect(result.lines.filter((line) => line.kind === 'err')).toHaveLength(1)
  })
})

describe('parseTimesheet line classification', () => {
  it('records an error line with its line number and raw text', () => {
    const input = `16/3/26

ACME-4126 8:40am-9:18am
BAD-1 not-a-time`

    const result = parseTimesheet(input)
    const errors = result.lines.filter((line) => line.kind === 'err')

    expect(errors).toHaveLength(1)
    expect(errors[0].lineNumber).toBe(4)
    expect(errors[0].raw).toBe('BAD-1 not-a-time')
    expect(errors[0].errorMessage).toBeDefined()
  })

  it('records a skipped line with its line number and raw text', () => {
    const input = `16/3/26

ACME-4126 8:40am-9:18am
Lunch 12:35pm-1:15pm`

    const result = parseTimesheet(input)
    const skipped = result.lines.filter((line) => line.kind === 'skip')

    expect(skipped).toHaveLength(1)
    expect(skipped[0].lineNumber).toBe(4)
    expect(skipped[0].raw).toBe('Lunch 12:35pm-1:15pm')
  })

  it('classifies MAKEUP as skipped, not an error', () => {
    const result = parseTimesheet(`16/3/26\nMakeup 5pm-5:30pm`)

    expect(result.lines.filter((line) => line.kind === 'skip').map((line) => line.raw)).toContain('Makeup 5pm-5:30pm')
    expect(result.lines.filter((line) => line.kind === 'err')).toHaveLength(0)
  })

  it('classifies a non-ticket first word as skipped even with a valid time range', () => {
    const result = parseTimesheet(`16/3/26\nFooBar 9am-10am`)

    expect(result.lines.filter((line) => line.kind === 'skip')).toHaveLength(1)
    expect(result.lines.filter((line) => line.kind === 'ok')).toHaveLength(0)
  })

  it('marks the date line and blank lines by kind', () => {
    const result = parseTimesheet(`16/3/26\n\nACME-4126 8:40am-9:18am`)

    expect(result.lines[0].kind).toBe('date')
    expect(result.lines[1].kind).toBe('blank')
    expect(result.lines[2].kind).toBe('ok')
  })

  it('numbers lines from the raw input so the gutter stays aligned', () => {
    const result = parseTimesheet(`16/3/26\n\n\nPLAT-58 9am-10am`)

    expect(result.lines).toHaveLength(4)
    expect(result.lines[3].lineNumber).toBe(4)
    expect(result.lines[3].kind).toBe('ok')
  })
})

describe('parseTimesheet highlight tokens', () => {
  it('reconstructs the raw line exactly from its tokens', () => {
    const result = parseTimesheet(`16/3/26\nPLAT-140 3:50pm-5pm (timesheets + OKR)`)
    const okLine = result.lines.find((line) => line.kind === 'ok')
    if (!okLine) throw new Error('expected an ok line')

    expect(okLine.tokens.map((token) => token.text).join('')).toBe('PLAT-140 3:50pm-5pm (timesheets + OKR)')
  })

  it('tags the ticket, time, and comment segments', () => {
    const result = parseTimesheet(`16/3/26\nPLAT-140 3:50pm-5pm (note)`)
    const okLine = result.lines.find((line) => line.kind === 'ok')
    if (!okLine) throw new Error('expected an ok line')

    const textOf = (type: string) => okLine.tokens.filter((token) => token.type === type).map((token) => token.text)
    expect(textOf('ticket')).toEqual(['PLAT-140'])
    expect(textOf('time')).toEqual(['3:50pm-5pm'])
    expect(textOf('comment')).toEqual(['(note)'])
  })

  it('keeps the ticket coloured on an error line but leaves the rest plain', () => {
    const result = parseTimesheet(`16/3/26\nBAD-1 not-a-time`)
    const errLine = result.lines.find((line) => line.kind === 'err')
    if (!errLine) throw new Error('expected an err line')

    expect(errLine.tokens.map((token) => token.text).join('')).toBe('BAD-1 not-a-time')
    expect(errLine.tokens.filter((token) => token.type === 'ticket')).toHaveLength(1)
    expect(errLine.tokens.some((token) => token.type === 'time')).toBe(false)
  })
})
