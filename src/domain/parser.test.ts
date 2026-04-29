import { describe, it, expect } from 'vitest'
import { parseTimesheet } from './parser'

describe('parseTimesheet functional related tests', () => {
  it('parses a single ticket entry', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am`

    const result = parseTimesheet(input)

    expect(result.date).toBe('16/3/26')
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].ticketId).toBe('C25-3278')
    expect(result.entries[0].startTime).toBe('8:40am')
    expect(result.entries[0].endTime).toBe('9:18am')
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

    expect(result.date).toBe('16/3/26')
    expect(result.entries).toHaveLength(6)

    expect(result.entries[0].ticketId).toBe('C25-3278')
    expect(result.entries[0].startTime).toBe('8:40am')
    expect(result.entries[0].endTime).toBe('9:18am')
    expect(result.entries[0].description).toBeUndefined()

    expect(result.entries[5].ticketId).toBe('CCT-77')
    expect(result.entries[5].startTime).toBe('1:15pm')
    expect(result.entries[5].endTime).toBe('2:38pm')
    expect(result.entries[5].description).toBeUndefined()
  })

  it('parses a ticket entry with description', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am (test description)`

    const result = parseTimesheet(input)

    expect(result.date).toBe('16/3/26')
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].ticketId).toBe('C25-3278')
    expect(result.entries[0].startTime).toBe('8:40am')
    expect(result.entries[0].endTime).toBe('9:18am')
    expect(result.entries[0].description).toBe('test description')
  })

  it('parses description with multiple words', () => {
    const input = `16/3/26

FDES-13 3:28pm-3:50pm (Helping Vivian w/ Flinders)`

    const result = parseTimesheet(input)

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].ticketId).toBe('FDES-13')
    expect(result.entries[0].startTime).toBe('3:28pm')
    expect(result.entries[0].endTime).toBe('3:50pm')
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
  })

  it('handles duplicate ticket IDs as separate entries', () => {
    const input = `16/3/26

CCT-77 9:18am-10am

CCT-77 1:15pm-2:38pm`

    const result = parseTimesheet(input)

    expect(result.entries).toHaveLength(2)
    expect(result.entries[0].ticketId).toBe('CCT-77')
    expect(result.entries[0].startTime).toBe('9:18am')
    expect(result.entries[1].ticketId).toBe('CCT-77')
    expect(result.entries[1].startTime).toBe('1:15pm')
  })

  it('handles entry with no blank lines between entries', () => {
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
  })
})

describe('parseTimesheet lineInfo', () => {
  it('emits one LineInfo per input line, aligned positionally', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am
Lunch 12:35pm-1:15pm`

    const result = parseTimesheet(input)

    expect(result.lineInfo).toHaveLength(input.split(/\n/).length)
  })

  it('classifies each line kind', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am
Lunch 12:35pm-1:15pm
BAD-1 not-a-time`

    const result = parseTimesheet(input)

    expect(result.lineInfo.map(l => l.kind)).toEqual([
      'date',
      'blank',
      'ok',
      'skip',
      'err',
    ])
  })

  it('preserves trailing blank lines', () => {
    const input = `16/3/26

C25-3278 8:40am-9:18am

`

    const result = parseTimesheet(input)

    expect(result.lineInfo.at(-1)?.kind).toBe('blank')
    expect(result.lineInfo).toHaveLength(5)
  })

  it('classifies MAKEUP as skip (not err)', () => {
    const input = `16/3/26
Makeup 5pm-5:30pm`

    const result = parseTimesheet(input)

    expect(result.lineInfo[1].kind).toBe('skip')
  })

  it('classifies non-ticket first words as skip even with a valid time range', () => {
    const input = `16/3/26
FooBar 9am-10am`

    const result = parseTimesheet(input)

    expect(result.lineInfo[1].kind).toBe('skip')
    expect(result.entries).toHaveLength(0)
  })
})