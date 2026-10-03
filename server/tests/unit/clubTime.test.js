import { toClubDate, localDayRange, generateTimeSlots, parseClubDateTime, CLUB_TZ } from '../../src/utils/clubTime.js'

describe('clubTime Utility', () => {
  test('returns date formatted in Asia/Kolkata timezone', () => {
    const today = toClubDate()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('localDayRange converts local date to correct UTC range', () => {
    const range = localDayRange('2026-10-05')
    expect(range.startIso).toBeDefined()
    expect(range.endIso).toBeDefined()
    expect(new Date(range.startIso).getTime()).toBeLessThan(new Date(range.endIso).getTime())
  })

  test('generateTimeSlots produces 30-min slots from open to close minus duration', () => {
    // 06:00 to 22:00 with 60 min session duration -> last slot starts at 21:00
    const slots = generateTimeSlots('06:00', '22:00', 60, 30)
    expect(slots[0]).toBe('06:00')
    expect(slots[slots.length - 1]).toBe('21:00')
    expect(slots).toContain('18:00')
    expect(slots).toContain('18:30')
    expect(slots.length).toBe(31) // (21:00 - 06:00)*2 + 1 = 15*2 + 1 = 31
  })

  test('parseClubDateTime parses local date and time into UTC instant', () => {
    const d = parseClubDateTime('2026-10-05', '18:00')
    expect(d instanceof Date).toBe(true)
    expect(d.toISOString()).toContain('2026-10-05T12:30:00') // 18:00 IST is 12:30 UTC
  })
})
