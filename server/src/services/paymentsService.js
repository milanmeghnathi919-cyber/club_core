import ApiError from '../utils/ApiError.js'
import paymentRepository from '../repositories/paymentRepository.js'
import memoryStore from '../utils/memoryStore.js'
import { round2 } from '../utils/money.js'
import { toClubDate } from '../utils/clubTime.js'
import { verifyPaymentSignature } from '../utils/razorpay.js'

/**
 * JSDoc: paymentsService - The single revenue ledger (BR-13)
 * Every cash-in must be recorded here. Waived items do not create rows.
 */
export const paymentsService = {
  /**
   * Record a payment into the central ledger.
   */
  async record({
    sourceType,
    sourceId,
    amount,
    method,
    category,
    revenueCategory,
    memberId = null,
    receivedBy = null,
    taxAmount = 0,
    status = 'paid',
    razorpayOrderId = null,
    razorpayPaymentId = null,
  }) {
    const numAmount = Number(amount)
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      throw new ApiError(422, 'Payment amount must be greater than 0', null, 'INVALID_AMOUNT')
    }

    if (method === 'pay_at_club') {
      // pay_at_club creates an unpaid source state, never a payment row
      return null
    }

    // Idempotency: if razorpayPaymentId already exists, return existing row
    if (razorpayPaymentId) {
      const existing = await paymentRepository.findByRazorpayPaymentId(razorpayPaymentId)
      if (existing) return existing
    }

    const row = await paymentRepository.insert({
      sourceType,
      sourceId,
      amount: round2(numAmount),
      method,
      revenueCategory: revenueCategory || category || 'court',
      memberId,
      receivedBy,
      taxAmount: round2(taxAmount),
      status,
      razorpayOrderId,
      razorpayPaymentId,
      paidAt: status === 'paid' ? new Date().toISOString() : null,
    })

    return row
  },

  /**
   * Refund a payment: status -> refunded, updates source payment_status -> refunded.
   */
  async refund(paymentId, _actorId) {
    const payment = await paymentRepository.findById(paymentId)
    if (!payment) {
      throw new ApiError(404, 'Payment not found', null, 'NOT_FOUND')
    }

    if (payment.status === 'refunded') {
      return payment
    }

    const updated = await paymentRepository.updateStatus(paymentId, 'refunded')

    // Mark source payment status as refunded if applicable
    const { source_type, source_id } = payment
    if (source_type === 'booking') {
      memoryStore.update('bookings', (b) => b.id === source_id, { payment_status: 'refunded' })
    } else if (source_type === 'shop_order') {
      memoryStore.update('shop_orders', (o) => o.id === source_id, { payment_status: 'refunded' })
    } else if (source_type === 'bar_tab') {
      memoryStore.update('bar_tabs', (t) => t.id === source_id, { status: 'void' })
    }

    return updated
  },

  /**
   * sumPaid: Used by dashboards and reports.
   * Only includes status=paid, excludes refunded.
   */
  async sumPaid({ from, to, groupBy = null } = {}) {
    const paidRows = await paymentRepository.getPaidRows(from, to)
    const activeRows = paidRows.filter((p) => p.status === 'paid')

    const total = round2(activeRows.reduce((acc, p) => acc + Number(p.amount), 0))

    if (!groupBy) {
      return { total, count: activeRows.length }
    }

    const groups = {}
    for (const row of activeRows) {
      let key = 'all'
      if (groupBy === 'day') {
        key = toClubDate(row.paid_at || row.created_at)
      } else if (groupBy === 'source') {
        key = row.source_type || 'other'
      } else if (groupBy === 'method') {
        key = row.method || 'cash'
      } else if (groupBy === 'category') {
        key = row.revenue_category || 'other'
      }

      if (!groups[key]) {
        groups[key] = { key, amount: 0, count: 0 }
      }
      groups[key].amount = round2(groups[key].amount + Number(row.amount))
      groups[key].count += 1
    }

    return Object.values(groups)
  },

  async list(filters) {
    return paymentRepository.list(filters)
  },

  async verifyRazorpay({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_signature) {
      throw new ApiError(400, 'Signature is required', null, 'SIGNATURE_INVALID')
    }

    try {
      verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      })
    } catch {
      throw new ApiError(400, 'Invalid payment signature', null, 'SIGNATURE_INVALID')
    }

    return { verified: true }
  },
}

export default paymentsService
