import membershipRepository from '../repositories/membershipRepository.js'
import planRepository from '../repositories/planRepository.js'
import paymentsService from './paymentsService.js'
import ApiError from '../utils/ApiError.js'
import { toClubDate } from '../utils/clubTime.js'
import { calcInclusiveTax } from '../utils/money.js'

export const membershipService = {
  /**
   * Get active membership for a member at a given date.
   */
  async getActive(memberId, date = new Date()) {
    if (!memberId) return null
    return membershipRepository.findActiveByMemberId(memberId, date)
  },

  /**
   * BR-12: Automatic member discount helper.
   * Returns discount percentage (e.g. 30 for 30%) or 0 if inactive / no member.
   * categories: 'court' | 'shop' | 'bar'
   */
  async discountFor(memberId, category, date = new Date()) {
    if (!memberId) return 0
    const active = await this.getActive(memberId, date)
    if (!active) return 0

    if (category === 'court') {
      return Number(active.court_discount_pct || 0)
    }
    if (category === 'shop') {
      return Number(active.shop_discount_pct || 0)
    }
    if (category === 'bar') {
      return Number(active.bar_discount_pct || 0)
    }
    return 0
  },

  /**
   * Assign or replace plan (BR-08).
   * Plan change: new row, old -> replaced, ends the day before.
   */
  async assignPlan(memberId, planId, { startDate = null, paymentMethod = 'cash', actorId = null } = {}) {
    const plan = await planRepository.findById(planId)
    if (!plan) throw new ApiError(404, 'Plan not found', null, 'NOT_FOUND')

    const start = startDate ? new Date(startDate) : new Date()
    const startStr = toClubDate(start)

    const end = new Date(start)
    end.setDate(end.getDate() + (Number(plan.duration_days) || 365) - 1)
    const endStr = toClubDate(end)

    // Check existing active membership
    const existingActive = await this.getActive(memberId, start)
    if (existingActive) {
      // End old membership the day before new starts
      const dayBefore = new Date(start)
      dayBefore.setDate(dayBefore.getDate() - 1)
      await membershipRepository.update(existingActive.id, {
        status: 'replaced',
        end_date: toClubDate(dayBefore),
      })
    }

    const price = Number(plan.price) || 0
    const taxAmount = calcInclusiveTax(price, 18)

    const membership = await membershipRepository.create({
      memberId,
      planId: plan.id,
      startDate: startStr,
      endDate: endStr,
      status: 'active',
      pricePaid: price,
      taxAmount,
      createdBy: actorId,
    })

    // Record payment if price > 0 and paid
    if (price > 0 && paymentMethod !== 'pay_at_club') {
      await paymentsService.record({
        sourceType: 'membership',
        sourceId: membership.id,
        amount: price,
        method: paymentMethod,
        category: 'membership',
        revenueCategory: 'membership',
        memberId,
        receivedBy: actorId,
        taxAmount,
        status: 'paid',
      })
    }

    return membership
  },

  async cancel(membershipId, actorId) {
    const mem = await membershipRepository.findById(membershipId)
    if (!mem) throw new ApiError(404, 'Membership not found', null, 'NOT_FOUND')

    return membershipRepository.update(membershipId, {
      status: 'cancelled',
      updated_by: actorId,
    })
  },
}

export const discountFor = (memberId, category, date) =>
  membershipService.discountFor(memberId, category, date)

export default membershipService
