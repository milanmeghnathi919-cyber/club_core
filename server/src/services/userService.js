import ApiError from '../utils/ApiError.js'
import userRepository from '../repositories/userRepository.js'
import { toPublicUser } from '../models/User.js'

export const userService = {
  async list({ page = 1, limit = 20, search } = {}) {
    const { items, total } = await userRepository.list({ page, limit, search })

    return {
      items: items.map(toPublicUser),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    }
  },

  async getById(id) {
    const user = await userRepository.findById(id)
    if (!user) throw ApiError.notFound('User not found')
    return toPublicUser(user)
  },

  async updateById(id, data) {
    const existing = await userRepository.findById(id)
    if (!existing) throw ApiError.notFound('User not found')
    return toPublicUser(await userRepository.updateById(id, data))
  },

  async remove(id) {
    const existing = await userRepository.findById(id)
    if (!existing) throw ApiError.notFound('User not found')
    await userRepository.deleteById(id)
    return null
  },
}

export default userService