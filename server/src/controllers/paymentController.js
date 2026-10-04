import paymentsService from '../services/paymentsService.js'
import shopService from '../services/shopService.js'
import bookingService from '../services/bookingService.js'
import barService from '../services/barService.js'
import memberRepository from '../repositories/memberRepository.js'
import membershipService from '../services/membershipService.js'
import razorpay from '../utils/razorpay.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok, paginated } from '../utils/response.js'

export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, from, to, method, sourceType, revenueCategory } = req.query
  const { items, total } = await paymentsService.list({
    page: Number(page),
    limit: Number(limit),
    from,
    to,
    method,
    sourceType,
    revenueCategory,
  })

  return paginated(res, items, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)) || 1,
  })
})

export const refund = asyncHandler(async (req, res) => {
  const { id } = req.params
  const payment = await paymentsService.refund(id, req.user?.id)
  return ok(res, payment)
})

export const createOrder = asyncHandler(async (req, res) => {
  const { amount, receipt, notes, currency = 'INR' } = req.body
  const order = await razorpay.createOrder({ amount: Number(amount), currency, receipt, notes })
  return ok(res, order)
})

export const verifyRazorpay = asyncHandler(async (req, res) => {
  const result = await paymentsService.verifyRazorpay(req.body)
  return ok(res, result)
})

export const processDummyPayment = asyncHandler(async (req, res) => {
  const {
    sourceType,
    sourceId,
    amount,
    method = 'card',
    simulatedStatus = 'success',
    memberId = null,
    notes = null,
  } = req.body

  if (simulatedStatus === 'failed') {
    throw new ApiError(402, 'Dummy payment simulation: Transaction was declined by issuing bank', null, 'SIMULATED_DECLINE')
  }

  const fakePaymentId = `pay_fake_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const actorId = req.user?.id || null
  let updatedRecord = null

  if (sourceType === 'shop_order' && sourceId) {
    try {
      updatedRecord = await shopService.pay(sourceId, { method: method || 'dummy_card', actorId })
    } catch (e) {
      console.warn('shopService.pay note:', e.message)
    }
  } else if (sourceType === 'booking' && sourceId) {
    try {
      updatedRecord = await bookingService.pay(sourceId, { method: method || 'dummy_card', actorId })
    } catch (e) {
      console.warn('bookingService.pay note:', e.message)
    }
  } else if (sourceType === 'bar_tab' && sourceId) {
    try {
      updatedRecord = await barService.settle(sourceId, {
        payments: [{ method: method || 'dummy_card', amount: Number(amount) }],
        actorId,
      })
    } catch (e) {
      console.warn('barService.settle note:', e.message)
    }
  } else if (sourceType === 'membership') {
    try {
      let targetMemberId = memberId
      if (!targetMemberId && req.user?.id) {
        const mem = await memberRepository.findByUserId(req.user.id)
        if (mem) targetMemberId = mem.id
      }

      const planId = req.body.planId || sourceId
      if (targetMemberId && planId) {
        updatedRecord = await membershipService.assignPlan(targetMemberId, planId, {
          paymentMethod: method || 'dummy_card',
          actorId,
        })
      } else {
        await paymentsService.record({
          sourceType: 'membership',
          sourceId: sourceId || 'plan',
          amount: Number(amount),
          method: method || 'dummy_card',
          category: 'membership',
          revenueCategory: 'membership',
          memberId: targetMemberId,
          receivedBy: actorId,
          status: 'paid',
          razorpayPaymentId: fakePaymentId,
        })
      }
    } catch (e) {
      console.warn('membership payment ledger record note:', e.message)
    }
  } else if (amount > 0) {
    try {
      await paymentsService.record({
        sourceType: sourceType || 'direct',
        sourceId: sourceId || null,
        amount: Number(amount),
        method: method || 'dummy_card',
        category: 'other',
        revenueCategory: 'other',
        memberId: memberId || req.user?.member?.id,
        receivedBy: actorId,
        status: 'paid',
        razorpayPaymentId: fakePaymentId,
      })
    } catch (e) {
      console.warn('generic ledger record note:', e.message)
    }
  }

  return ok(res, {
    success: true,
    paymentId: fakePaymentId,
    sourceType,
    sourceId,
    amount: Number(amount),
    method,
    status: 'paid',
    paidAt: new Date().toISOString(),
    record: updatedRecord,
  })
})

export default {
  list,
  refund,
  createOrder,
  verifyRazorpay,
  processDummyPayment,
}