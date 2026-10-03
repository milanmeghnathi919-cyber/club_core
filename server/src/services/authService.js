import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import ApiError from '../utils/ApiError.js'
import userRepository from '../repositories/userRepository.js'
import { toPublicUser } from '../models/User.js'

const SALT_ROUNDS = 12

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })

export const authService = {
  async register({ name, email, password, phone }) {
    const existing = await userRepository.findByEmail(email)
    if (existing) throw ApiError.conflict('Email already registered')

    const user = await userRepository.create({
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
    })

    return { user: toPublicUser(user), token: signToken(user) }
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email)
    if (!user) throw ApiError.unauthorized('Invalid email or password')

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) throw ApiError.unauthorized('Invalid email or password')

    if (!user.is_active) throw ApiError.forbidden('Account is disabled')

    await userRepository.updateLastLogin(user.id)

    return { user: toPublicUser(user), token: signToken(user) }
  },

  async me(userId) {
    const user = await userRepository.findById(userId)
    if (!user) throw ApiError.notFound('User not found')
    return toPublicUser(user)
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findByEmail(
      (await userRepository.findById(userId)).email,
    )
    if (!user) throw ApiError.notFound('User not found')

    const ok = await bcrypt.compare(currentPassword, user.password_hash)
    if (!ok) throw ApiError.unauthorized('Current password is incorrect')

    const updated = await userRepository.updateById(userId, {
      passwordHash: await bcrypt.hash(newPassword, SALT_ROUNDS),
    })
    return toPublicUser(updated)
  },
}

export default authService