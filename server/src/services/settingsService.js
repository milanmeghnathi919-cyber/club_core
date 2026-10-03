import settingsRepository from '../repositories/settingsRepository.js'

let cachedSettings = null
let cacheExpiresAt = 0
const CACHE_TTL_MS = 30 * 1000 // 30 seconds

export const settingsService = {
  async get() {
    const now = Date.now()
    if (cachedSettings && now < cacheExpiresAt) {
      return { ...cachedSettings }
    }

    const fresh = await settingsRepository.get('general')
    cachedSettings = fresh
    cacheExpiresAt = now + CACHE_TTL_MS
    return { ...fresh }
  },

  async update(patch) {
    const current = await this.get()
    const merged = {
      ...current,
      ...patch,
      taxRates: {
        ...(current.taxRates || {}),
        ...(patch.taxRates || {}),
      },
      socialPlay: {
        ...(current.socialPlay || {}),
        ...(patch.socialPlay || {}),
      },
    }

    const saved = await settingsRepository.set('general', merged)
    // Invalidate cache
    cachedSettings = saved
    cacheExpiresAt = Date.now() + CACHE_TTL_MS
    return { ...saved }
  },
}

export default settingsService
