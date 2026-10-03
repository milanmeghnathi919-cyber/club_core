import memberRepository from '../repositories/memberRepository.js'
import membershipRepository from '../repositories/membershipRepository.js'
import planRepository from '../repositories/planRepository.js'
import membershipService from './membershipService.js'
import userRepository from '../repositories/userRepository.js'
import paymentRepository from '../repositories/paymentRepository.js'
import memoryStore from '../utils/memoryStore.js'
import ApiError from '../utils/ApiError.js'
import { toClubDate } from '../utils/clubTime.js'
import { nextMemberCode } from '../utils/numbering.js'
import { sendMail } from '../utils/mailer.js'
import bcrypt from 'bcryptjs'

export const memberService = {
  async list({ page = 1, limit = 20, search, status, planId }) {
    const { items, total } = await memberRepository.list({ page, limit, search, planId })

    const enriched = await Promise.all(
      items.map(async (m) => {
        const active = await membershipService.getActive(m.id)
        return {
          id: m.id,
          memberCode: m.member_code,
          fullName: m.full_name,
          phone: m.phone,
          email: m.email,
          dob: m.dob,
          photoUrl: m.photo_url,
          membership: active
            ? {
                id: active.id,
                planCode: active.plan_code,
                planName: active.plan_name,
                startDate: active.start_date,
                endDate: active.end_date,
                status: active.status,
              }
            : null,
          createdAt: m.created_at,
        }
      })
    )

    return { items: enriched, total }
  },

  async lookup(q) {
    if (!q || q.trim().length < 2) {
      return []
    }
    const results = await memberRepository.lookup(q.trim())
    return Promise.all(
      results.map(async (m) => {
        const active = await membershipService.getActive(m.id)
        return {
          id: m.id,
          memberCode: m.member_code,
          fullName: m.full_name,
          phone: m.phone,
          email: m.email,
          planName: active?.plan_name || 'Walk-in',
          planCode: active?.plan_code || null,
          hasActiveMembership: !!active,
        }
      })
    )
  },

  async get(id) {
    const m = await memberRepository.findById(id)
    if (!m) throw new ApiError(404, 'Member not found', null, 'NOT_FOUND')

    const active = await membershipService.getActive(m.id)
    let daysLeft = null
    let expiringSoon = false

    if (active && active.end_date) {
      const today = new Date(toClubDate())
      const end = new Date(active.end_date)
      const diffTime = end - today
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      expiringSoon = daysLeft <= 7 && daysLeft >= 0
    }

    return {
      id: m.id,
      memberCode: m.member_code,
      userId: m.user_id,
      fullName: m.full_name,
      phone: m.phone,
      email: m.email,
      dob: m.dob,
      address: m.address,
      emergencyContact: m.emergency_contact,
      photoUrl: m.photo_url,
      notes: m.notes,
      membership: active
        ? {
            id: active.id,
            planId: active.plan_id,
            planCode: active.plan_code,
            planName: active.plan_name,
            startDate: active.start_date,
            endDate: active.end_date,
            status: active.status,
            courtDiscountPct: Number(active.court_discount_pct || 0),
            shopDiscountPct: Number(active.shop_discount_pct || 0),
            barDiscountPct: Number(active.bar_discount_pct || 0),
            daysLeft,
            expiringSoon,
          }
        : null,
      createdAt: m.created_at,
    }
  },

  async create(data, actorId) {
    // Unique check
    const existingPhone = await memberRepository.findByPhone(data.phone)
    if (existingPhone) {
      throw new ApiError(409, 'A member with this phone number already exists', null, 'PHONE_EXISTS')
    }

    if (data.email) {
      const existingUser = await userRepository.findByEmail(data.email)
      if (existingUser) {
        throw new ApiError(409, 'An account with this email already exists', null, 'EMAIL_EXISTS')
      }
    }

    // Junior age verification rule (BR-07): Junior plan requires age < 18 on start date
    if (data.planId) {
      const plan = await planRepository.findById(data.planId)
      if (plan && plan.code?.toLowerCase() === 'junior') {
        if (!data.dob) {
          throw new ApiError(422, 'Date of birth is required for Junior membership', null, 'JUNIOR_AGE_MISMATCH')
        }
        const birthDate = new Date(data.dob)
        const refDate = data.startDate ? new Date(data.startDate) : new Date()
        let age = refDate.getFullYear() - birthDate.getFullYear()
        const m = refDate.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && refDate.getDate() < birthDate.getDate())) {
          age--
        }
        if (age >= 18) {
          throw new ApiError(422, 'Junior plan requires age under 18 years', null, 'JUNIOR_AGE_MISMATCH')
        }
      }
    }

    let userId = null
    let tempPassword = null
    if (data.createLogin && data.email) {
      tempPassword = Math.random().toString(36).slice(-8) + 'A1!'
      const passwordHash = await bcrypt.hash(tempPassword, 10)
      const newUser = await userRepository.create({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        role: 'member',
        passwordHash,
      })
      userId = newUser.id

      // Email temporary password (failure never blocks main operation)
      sendMail({
        to: data.email,
        subject: 'Welcome to The Champions Club - Your Account',
        text: `Hello ${data.fullName},\n\nYour account has been created. Your temporary password is: ${tempPassword}\n\nPlease log in and update your password.`,
      }).catch(() => {})
    }

    const memberCode = await nextMemberCode()
    const member = await memberRepository.create({
      memberCode,
      userId,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      dob: data.dob,
      address: data.address,
      emergencyContact: data.emergencyContact,
      photoUrl: data.photoUrl,
      notes: data.notes,
      createdBy: actorId,
    })

    if (data.planId) {
      await membershipService.assignPlan(member.id, data.planId, {
        startDate: data.startDate,
        paymentMethod: data.paymentMethod || 'cash',
        actorId,
      })
    }

    return this.get(member.id)
  },

  async update(id, data) {
    await this.get(id)
    const updates = {}
    if (data.fullName !== undefined) updates.full_name = data.fullName
    if (data.email !== undefined) updates.email = data.email
    if (data.phone !== undefined) updates.phone = data.phone
    if (data.dob !== undefined) updates.dob = data.dob
    if (data.address !== undefined) updates.address = data.address
    if (data.emergencyContact !== undefined) updates.emergency_contact = data.emergencyContact
    if (data.photoUrl !== undefined) updates.photo_url = data.photoUrl
    if (data.notes !== undefined) updates.notes = data.notes

    await memberRepository.update(id, updates)
    return this.get(id)
  },

  async getHistory(id, { page = 1, limit = 20, type = null } = {}) {
    await this.get(id)

    // Aggregate timeline from bookings, shop orders, bar tabs, payments, memberships
    const events = []

    const memberships = await membershipRepository.findByMemberId(id)
    for (const m of memberships) {
      if (!type || type === 'membership') {
        events.push({
          type: 'membership',
          id: m.id,
          date: m.start_date || m.created_at,
          description: `Plan: ${m.plan_name || m.plan_code || 'Standard'} (${m.status})`,
          amount: Number(m.price_paid || 0),
        })
      }
    }

    const bookings = memoryStore.find('bookings', (b) => b.member_id === id)
    for (const b of bookings) {
      if (!type || type === 'booking') {
        events.push({
          type: 'booking',
          id: b.id,
          date: b.start_at,
          description: `Court Booking: ${b.booking_no || 'BK'} (${b.status})`,
          amount: Number(b.price || 0),
        })
      }
    }

    const orders = memoryStore.find('shop_orders', (o) => o.member_id === id)
    for (const o of orders) {
      if (!type || type === 'shop_order') {
        events.push({
          type: 'shop_order',
          id: o.id,
          date: o.created_at,
          description: `Shop Order: ${o.order_no || 'ORD'} (${o.status})`,
          amount: Number(o.total || 0),
        })
      }
    }

    const tabs = memoryStore.find('bar_tabs', (t) => t.member_id === id)
    for (const t of tabs) {
      if (!type || type === 'bar_tab') {
        events.push({
          type: 'bar_tab',
          id: t.id,
          date: t.opened_at || t.created_at,
          description: `Bar Tab: ${t.tab_no || 'TAB'} (${t.status})`,
          amount: Number(t.total || 0),
        })
      }
    }

    events.sort((a, b) => new Date(b.date) - new Date(a.date))
    const offset = (page - 1) * limit
    return {
      items: events.slice(offset, offset + limit),
      total: events.length,
    }
  },
}

export default memberService