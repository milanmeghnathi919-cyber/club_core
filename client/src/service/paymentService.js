import api from './api'

export const paymentService = {
  /**
   * Create a simulated / Razorpay test order
   */
  async createOrder({ amount, receipt, notes, currency = 'INR' }) {
    const res = await api.post('/payments/create-order', {
      amount,
      receipt,
      notes,
      currency,
    })
    return res.data
  },

  /**
   * Process a dummy payment simulation for any service or item.
   * Supports simulated success and simulated failure.
   */
  async processDummyPayment({
    sourceType,
    sourceId,
    planId = null,
    amount,
    method = 'card',
    simulatedStatus = 'success',
    memberId = null,
    notes = null,
  }) {
    const res = await api.post('/payments/dummy/process', {
      sourceType,
      sourceId,
      planId,
      amount,
      method,
      simulatedStatus,
      memberId,
      notes,
    })
    return res.data
  },

  /**
   * Verify Razorpay payment signature
   */
  async verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const res = await api.post('/payments/razorpay/verify', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    })
    return res.data
  },

  /**
   * List payments ledger (FD+ / Owner)
   */
  async list(params = {}) {
    const res = await api.get('/payments', { params })
    return res.data || []
  },
}

export default paymentService
