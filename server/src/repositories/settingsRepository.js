import { queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'

const DEFAULT_SETTINGS = {
  clubName: 'The Champions Club',
  openTime: '06:00',
  closeTime: '22:00',
  slotDurationMinutes: 60,
  slotIntervalMinutes: 30,
  bookingWindowDays: 14,
  cancelCutoffHours: 2,
  deliveryFee: 50,
  onlineOrderHoldMinutes: 30,
  taxRates: {
    court: 18,
    shop: 18,
    food: 5,
    drink: 18,
  },
  socialPlay: {
    dayOfWeek: 5, // Friday
    startTime: '18:00',
    endTime: '22:00',
    defaultCapacity: 8,
    defaultPricePerHead: 250,
  },
}

export const settingsRepository = {
  async get(key = 'general') {
    try {
      const row = await queryOne('select value from public.settings where key = $1', [key])
      if (row && row.value) {
        return typeof row.value === 'string' ? JSON.parse(row.value) : row.value
      }
    } catch {}

    const mem = memoryStore.findOne('settings', (s) => s.key === key)
    if (mem && mem.value) return mem.value

    return DEFAULT_SETTINGS
  },

  async set(key = 'general', value) {
    try {
      const row = await queryOne(
        `insert into public.settings (key, value, updated_at)
         values ($1, $2, now())
         on conflict (key) do update set value = $2, updated_at = now()
         returning value`,
        [key, JSON.stringify(value)]
      )
      if (row && row.value) {
        const val = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
        memoryStore.update('settings', (s) => s.key === key, { value: val })
        return val
      }
    } catch {}

    const existing = memoryStore.findOne('settings', (s) => s.key === key)
    if (existing) {
      memoryStore.update('settings', (s) => s.key === key, { value })
    } else {
      memoryStore.insert('settings', { key, value })
    }
    return value
  },
}

export default settingsRepository
