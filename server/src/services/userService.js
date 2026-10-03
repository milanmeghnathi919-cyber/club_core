import ApiError from '../utils/ApiError.js'
import userRepository from '../repositories/userRepository.js'

export const userService = {
  async list({ page = 1, limit = 20 } = {}) {
    const [items, total] = await Promise.all([
      userRepository.findAll({ page, limit }),
      userRepository.count(),
    ])

    return {
      items: items.map((u) => u.toPublic()),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    }
  },

  async getById(id) {
    const user = await userRepository.findById(id)
    if (!user) throw ApiError.notFound('User not found')
    return user.toPublic()
  },

  async remove(id) {
    const user = await userRepository.findById(id)
    if (!user) throw ApiError.notFound('User not found')
    await user.deleteOne()
    return null
  },
}

export default userService