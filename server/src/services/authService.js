import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import ApiError from '../utils/ApiError.js'
import userRepository from '../repositories/userRepository.js'
import memberRepository from '../repositories/memberRepository.js'
import membershipRepository from '../repositories/membershipRepository.js'
import { toPublicUser } from '../models/User.js'
import { ROLES } from '../config/roles.js'
import { nextMemberCode } from '../utils/numbering.js'

const SALT_ROUNDS = 10

const signToken = (user) =>
  jwt.sign(
    { sub: user.id, id: user.id, role: user.role, email: user.email },
    config.jwtSecret || 'dev-secret-key-12345',
    { expiresIn: config.jwtExpiresIn || '7d' }
  )

export const authService = {
  async register({ name, email, password, phone }) {
    const cleanEmail = String(email).toLowerCase().trim()
    const cleanPhone = phone ? String(phone).trim() : null

    const existingEmail = await userRepository.findByEmail(cleanEmail)
    if (existingEmail) {
      throw new ApiError(409, 'An account with that email already exists', null, 'EMAIL_EXISTS')
    }

    if (cleanPhone) {
      const existingPhone = await memberRepository.findByPhone(cleanPhone)
      if (existingPhone) {
        throw new ApiError(409, 'An account with that phone number already exists', null, 'PHONE_EXISTS')
      }
    }

    // Role is ALWAYS member on registration (BR / Security: ignore body role)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await userRepository.create({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      role: ROLES.MEMBER,
      passwordHash,
    })

    // Create corresponding member profile
    const memberCode = nextMemberCode()
    const member = await memberRepository.create({
      memberCode,
      userId: user.id,
      fullName: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
    })

    const token = signToken(user)
    return {
      user: toPublicUser(user),
      token,
      member,
    }
  },

  async login({ email, password }) {
    const cleanEmail = String(email).toLowerCase().trim()
    const user = await userRepository.findByEmail(cleanEmail)
    if (!user) {
      throw new ApiError(401, 'Invalid email or password', null, 'INVALID_CREDENTIALS')
    }

    if (user.is_active === false) {
      throw new ApiError(401, 'Account has been disabled', null, 'ACCOUNT_DISABLED')
    }

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      throw new ApiError(401, 'Invalid email or password', null, 'INVALID_CREDENTIALS')
    }

    await userRepository.updateLastLogin(user.id)
    const token = signToken(user)

    const member = await memberRepository.findByUserId(user.id)
    let membership = null
    if (member) {
      membership = await membershipRepository.findActiveByMemberId(member.id)
    }

    return {
      user: toPublicUser(user),
      token,
      member: member || null,
      membership: membership || null,
    }
  },

  async me(userId) {
    const user = await userRepository.findById(userId)
    if (!user) throw new ApiError(404, 'User not found', null, 'NOT_FOUND')

    const member = await memberRepository.findByUserId(userId)
    let membership = null
    if (member) {
      membership = await membershipRepository.findActiveByMemberId(member.id)
    }

    return {
      user: toPublicUser(user),
      member: member || null,
      membership: membership || null,
    }
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findById(userId)
    if (!user) throw new ApiError(404, 'User not found', null, 'NOT_FOUND')

    // Read with password_hash
    const fullUser = await userRepository.findByEmail(user.email)
    const ok = await bcrypt.compare(currentPassword, fullUser.password_hash)
    if (!ok) {
      throw new ApiError(400, 'Current password is incorrect', null, 'INVALID_PASSWORD')
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await userRepository.updatePassword(userId, newHash)
    return { success: true }
  },
}

export default authService