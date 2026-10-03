import supabase from '../config/supabase.js'
import ApiError from '../utils/ApiError.js'
import { createOrder, verifyPaymentSignature } from '../utils/razorpay.js'

const TABLE = 'payments'

const nextPaymentNo = async () => {
  const { data } = await supabase.rpc('next_payment_no').maybeSingle()
  return data ?? null
}

export const paymentService = {
  async record({
    sourceType,
    sourceId,
    memberId = null,
    amount,
    method,
    revenueCategory = 'other',
    razorpayOrderId = null,
    razorpayPaymentId = null,
    receivedBy = null,
  }) {
    const paymentNo = await nextPaymentNo()

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        payment_no: paymentNo,
        source_type: sourceType,
        source_id: sourceId ?? null,
        member_id: memberId,
        amount,
        method,
        status: 'success',
        revenue_category: revenueCategory,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        received_by: receivedBy,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async createRazorpayOrder({ amount, receipt, notes }) {
    return createOrder({ amount, receipt, notes })
  },

  async verifyRazorpayPayment(payload) {
    verifyPaymentSignature(payload)
    return true
  },

  async list({ page = 1, limit = 20, revenueCategory } = {}) {
    const from = (page - 1) * limit

    let query = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (revenueCategory) query = query.eq('revenue_category', revenueCategory)

    const { data, count, error } = await query.range(from, from + limit - 1)
    if (error) throw new Error(error.message)

    return { items: data ?? [], total: count ?? 0, page, limit }
  },

  async revenueSummary({ from, to }) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('revenue_category, amount')
      .eq('status', 'success')
      .gte('paid_at', from)
      .lte('paid_at', to)

    if (error) throw new Error(error.message)

    return (data ?? []).reduce((acc, row) => {
      acc[row.revenue_category] = (acc[row.revenue_category] ?? 0) + Number(row.amount)
      return acc
    }, {})
  },
}

export default paymentService