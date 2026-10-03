import courtRepository from '../repositories/courtRepository.js'
import ApiError from '../utils/ApiError.js'

export const courtService = {
  async list({ includeInactive = false, sport = null } = {}) {
    const courts = await courtRepository.list({
      isActive: includeInactive ? undefined : true,
      sport,
    })

    return courts.map((c) => ({
      id: c.id,
      name: c.name,
      sport: c.sport,
      ratePerHour: Number(c.rate_per_hour),
      description: c.description,
      imageUrl: c.image_url,
      isActive: c.is_active,
      createdAt: c.created_at,
    }))
  },

  async get(id) {
    const c = await courtRepository.findById(id)
    if (!c) throw new ApiError(404, 'Court not found', null, 'NOT_FOUND')
    return {
      id: c.id,
      name: c.name,
      sport: c.sport,
      ratePerHour: Number(c.rate_per_hour),
      description: c.description,
      imageUrl: c.image_url,
      isActive: c.is_active,
      createdAt: c.created_at,
    }
  },

  async create(data) {
    const created = await courtRepository.create(data)
    return this.get(created.id)
  },

  async update(id, data) {
    await this.get(id)
    const updates = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.sport !== undefined) updates.sport = data.sport
    if (data.ratePerHour !== undefined) updates.rate_per_hour = data.ratePerHour
    if (data.description !== undefined) updates.description = data.description
    if (data.imageUrl !== undefined) updates.image_url = data.imageUrl
    if (data.isActive !== undefined) updates.is_active = data.isActive

    await courtRepository.update(id, updates)
    return this.get(id)
  },
}

export default courtService
