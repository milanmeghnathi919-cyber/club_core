import { formatInTimeZone, toDate } from 'date-fns-tz'

export const CLUB_TZ = process.env.CLUB_TZ || 'Asia/Kolkata'

/**
 * Format an instant into club timezone string.
 */
export const formatClub = (date, fmt = "yyyy-MM-dd'T'HH:mm:ssXXX") => {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return null
  return formatInTimeZone(d, CLUB_TZ, fmt)
}

/**
 * Convert instant to YYYY-MM-DD in Asia/Kolkata.
 */
export const toClubDate = (date = new Date()) => {
  if (!date) return formatInTimeZone(new Date(), CLUB_TZ, 'yyyy-MM-dd')
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return formatInTimeZone(new Date(), CLUB_TZ, 'yyyy-MM-dd')
  return formatInTimeZone(d, CLUB_TZ, 'yyyy-MM-dd')
}

/**
 * Convert YYYY-MM-DD into start of day and end of day in UTC.
 * Since Asia/Kolkata is UTC+05:30:
 * Day starts at 00:00:00 IST -> previous day 18:30:00 UTC.
 * Day ends at 23:59:59.999 IST -> same day 18:29:59.999 UTC.
 */
export const localDayRange = (dateStr) => {
  const startLocal = `${dateStr}T00:00:00.000`
  const endLocal = `${dateStr}T23:59:59.999`
  
  const startUtc = toDate(startLocal, { timeZone: CLUB_TZ })
  const endUtc = toDate(endLocal, { timeZone: CLUB_TZ })

  return {
    startUtc,
    endUtc,
    startIso: startUtc.toISOString(),
    endIso: endUtc.toISOString(),
  }
}

/**
 * Parse local date and time ("YYYY-MM-DD", "HH:mm") into UTC Date object.
 */
export const parseClubDateTime = (dateStr, timeStr) => {
  const localIso = `${dateStr}T${timeStr}:00`
  return toDate(localIso, { timeZone: CLUB_TZ })
}

/**
 * Generate 30-min start time slots between openTime ("06:00") and closeTime ("22:00").
 * Session length is 60 min, so last start time is closeTime minus 60 min ("21:00").
 */
export const generateTimeSlots = (openTime = '06:00', closeTime = '22:00', slotDurationMinutes = 60, intervalMinutes = 30) => {
  const parseMin = (str) => {
    const [h, m] = str.split(':').map(Number)
    return h * 60 + m
  }
  const formatMin = (m) => {
    const h = Math.floor(m / 60)
    const min = m % 60
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }

  const startMin = parseMin(openTime)
  const endMin = parseMin(closeTime)
  const lastStartMin = endMin - slotDurationMinutes

  const slots = []
  for (let current = startMin; current <= lastStartMin; current += intervalMinutes) {
    slots.push(formatMin(current))
  }
  return slots
}

export default {
  CLUB_TZ,
  formatClub,
  toClubDate,
  localDayRange,
  parseClubDateTime,
  generateTimeSlots,
}
