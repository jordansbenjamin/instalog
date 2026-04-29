import { describe, it, expect } from 'vitest'
import { parseTimesheet } from './parser'

describe('parseTimesheet functional related tests', () => {
  it('parses a single ticket entry', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am`

    const result = parseTimesheet(input)

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

    const result = parseTimesheet(input)

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

    const result = parseTimesheet(input)

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

    const result = parseTimesheet(input)

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

    const result = parseTimesheet(input)

    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].ticketId).toBe('FDES-13')
    expect(result.entries[1].ticketId).toBe('CCT-77')
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0].rawLine).toBe('Lunch 12:35pm-1:15pm')
  })

  it('handles duplicate ticket IDs as separate entries', () => {
    const input = `16/3/26

CCT-77 9:18am-10am

CCT-77 1:15pm-2:38pm`

    const result = parseTimesheet(input)

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

    const result = parseTimesheet(input)

    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].ticketId).toBe('C25-3278')
    expect(result.entries[1].ticketId).toBe('CCT-77')
  })

  it('skips makeup time entries', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am

Makeup 5pm-5:30pm`

    const result = parseTimesheet(input)

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].ticketId).toBe('C25-3278')
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0].rawLine).toBe('Makeup 5pm-5:30pm')
  })
})

describe('parseTimesheet classification tests', () => {
  it('records parse errors with line number and raw line', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am
BAD-1 not-a-time`

    const result = parseTimesheet(input)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].lineNumber).toBe(4)
    expect(result.errors[0].rawLine).toBe('BAD-1 not-a-time')
  })

  it('records skipped lines with line number and raw line', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am
Lunch 12:35pm-1:15pm`

    const result = parseTimesheet(input)

    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0].lineNumber).toBe(4)
    expect(result.skipped[0].rawLine).toBe('Lunch 12:35pm-1:15pm')
  })

  it('classifies MAKEUP as skipped (not an error)', () => {
    const input = `16/3/26
Makeup 5pm-5:30pm`

    const result = parseTimesheet(input)

    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0].rawLine).toBe('Makeup 5pm-5:30pm')
    expect(result.errors).toHaveLength(0)
  })

  it('classifies non-ticket first words as skipped even with a valid time range', () => {
    const input = `16/3/26
FooBar 9am-10am`

    const result = parseTimesheet(input)

    expect(result.skipped).toHaveLength(1)
    expect(result.entries).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })
})
