import bcrypt from 'bcryptjs'
import ApiError from '../utils/ApiError.js'
import userRepository from '../repositories/userRepository.js'
import { toPublicUser } from '../models/User.js'
import { ROLES } from '../config/roles.js'

const SALT_ROUNDS = 12

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

  /** Staff account creation. Password is hashed before it reaches the repository. */
  async create({ name, email, phone, password, role, isEmailVerified = false }) {
    if (!password || password.length < 8) {
      throw ApiError.badRequest('Validation failed', [
        { field: 'password', message: 'Must be at least 8 characters' },
      ])
    }

    const existing = await userRepository.findByEmail(email)
    if (existing) throw ApiError.conflict('Email already registered')

    const user = await userRepository.create({
      name,
      email,
      phone,
      role,
      isEmailVerified,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
    })

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