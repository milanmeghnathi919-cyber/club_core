import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import ApiError from '../utils/ApiError.js'
import userRepository from '../repositories/userRepository.js'
import memberRepository from '../repositories/memberRepository.js'
import membershipRepository from '../repositories/membershipRepository.js'
import hrRepository from '../repositories/hrRepository.js'
import { queryOne } from '../utils/db.js'
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
  async register({ name, email, password, phone, dob }) {
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
    const memberCode = await nextMemberCode()
    const member = await memberRepository.create({
      memberCode,
      userId: user.id,
      fullName: name.trim(),
      phone: cleanPhone || 'Not Provided',
      email: cleanEmail,
      dob: dob || null,
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

    let member = await memberRepository.findByUserId(userId)
    if (!member && user.email) {
      member = await memberRepository.findByEmail(user.email)
    }

    let membership = null
    let membershipHistory = []
    if (member) {
      membership = await membershipRepository.findActiveByMemberId(member.id)
      membershipHistory = await membershipRepository.findByMemberId(member.id)
      if (!membership && membershipHistory && membershipHistory.length > 0) {
        membership = membershipHistory[0]
      }
    }

    let employee = null
    if (user.role !== 'member') {
      employee = await hrRepository.findEmployeeByUserId(userId)
      if (!employee && user.email) {
        try {
          employee = await queryOne('select * from public.employees where lower(email) = $1', [
            user.email.toLowerCase(),
          ])
        } catch {}
      }
    }

    return {
      user: toPublicUser(user),
      member: member || null,
      membership: membership || null,
      membershipHistory: membershipHistory || [],
      employee: employee || null,
    }
  },

  async updateProfile(userId, data) {
    const user = await userRepository.findById(userId)
    if (!user) throw new ApiError(404, 'User not found', null, 'NOT_FOUND')

    const userUpdates = {}
    if (data.name !== undefined) userUpdates.name = data.name
    if (data.phone !== undefined) userUpdates.phone = data.phone
    if (Object.keys(userUpdates).length > 0) {
      await userRepository.update(userId, userUpdates)
    }

    let member = await memberRepository.findByUserId(userId)
    if (!member && user.email) {
      member = await memberRepository.findByEmail(user.email)
    }

    if (member) {
      const memberUpdates = {}
      if (data.name !== undefined) memberUpdates.full_name = data.name
      if (data.phone !== undefined) memberUpdates.phone = data.phone
      if (data.address !== undefined) memberUpdates.address = data.address
      if (data.emergencyContact !== undefined || data.emergency_contact !== undefined) {
        memberUpdates.emergency_contact = data.emergencyContact ?? data.emergency_contact
      }
      if (data.dob !== undefined) memberUpdates.dob = data.dob
      if (data.photoUrl !== undefined || data.photo_url !== undefined) {
        memberUpdates.photo_url = data.photoUrl ?? data.photo_url
      }
      if (Object.keys(memberUpdates).length > 0) {
        await memberRepository.update(member.id, memberUpdates)
      }
    }

    if (user.role !== 'member') {
      const employee = await hrRepository.findEmployeeByUserId(userId)
      if (employee) {
        const empUpdates = {}
        if (data.name !== undefined) empUpdates.full_name = data.name
        if (data.phone !== undefined) empUpdates.phone = data.phone
        if (Object.keys(empUpdates).length > 0) {
          await hrRepository.updateEmployee(employee.id, empUpdates)
        }
      }
    }

    return this.me(userId)
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