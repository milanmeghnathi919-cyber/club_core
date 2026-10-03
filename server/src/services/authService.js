import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import ApiError from '../utils/ApiError.js'
import userRepository from '../repositories/userRepository.js'

const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })

export const authService = {
  async register({ name, email, password }) {
    if (await userRepository.existsByEmail(email)) {
      throw ApiError.conflict('Email already registered')
    }
    const user = await userRepository.create({ name, email, password })
    return { user: user.toPublic(), token: signToken(user) }
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email)
    if (!user) throw ApiError.unauthorized('Invalid email or password')

    const ok = await user.comparePassword(password)
    if (!ok) throw ApiError.unauthorized('Invalid email or password')

    return { user: user.toPublic(), token: signToken(user) }
  },
}

export default authService