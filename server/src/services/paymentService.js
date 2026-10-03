import { query, queryOne, transaction } from '../utils/db.js'
import ApiError from '../utils/ApiError.js'
import { createOrder, verifyPaymentSignature } from '../utils/razorpay.js'

const TABLE = 'payments'
const COLS = 'id, payment_no, source_type, source_id, member_id, amount, method, status, revenue_category, razorpay_order_id, razorpay_payment_id, received_by, paid_at, created_at'

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
    // the number comes from the db sequence, never from the client
    const row = await queryOne(
      `insert into public.${TABLE}
         (payment_no, source_type, source_id, member_id, amount, method,
          status, revenue_category, razorpay_order_id, razorpay_payment_id,
          received_by, paid_at)
       values (next_payment_no(), $1,$2,$3,$4,$5,'success',$6,$7,$8,$9, now())
       returning ${COLS}`,
      [
        sourceType,
        sourceId ?? null,
        memberId,
        amount,
        method,
        revenueCategory,
        razorpayOrderId,
        razorpayPaymentId,
        receivedBy,
      ],
    )
    return row
  },

  /**
   * Record a payment and mark its source document paid, atomically.
   * Used after a Razorpay verification succeeds.
   */
  async recordAndMarkSourcePaid(payload, sourceTable) {
    const allowed = ['memberships', 'bookings', 'shop_orders', 'bar_tabs', 'invoices']
    if (!allowed.includes(sourceTable)) {
      throw ApiError.badRequest(`Unsupported source table: ${sourceTable}`)
    }

    return transaction(async ({ query: tx }) => {
      const insert = await tx.query(
        `insert into public.${TABLE}
           (payment_no, source_type, source_id, member_id, amount, method,
            status, revenue_category, razorpay_order_id, razorpay_payment_id,
            received_by, paid_at)
         values (next_payment_no(), $1,$2,$3,$4,$5,'success',$6,$7,$8,$9, now())
         returning ${COLS}`,
        [
          payload.sourceType,
          payload.sourceId ?? null,
          payload.memberId ?? null,
          payload.amount,
          payload.method,
          payload.revenueCategory ?? 'other',
          payload.razorpayOrderId ?? null,
          payload.razorpayPaymentId ?? null,
          payload.receivedBy ?? null,
        ],
      )

      if (payload.sourceId) {
        await tx.query(
          `update public.${sourceTable} set payment_status = 'paid' where id = $1`,
          [payload.sourceId],
        )
      }

      return insert.rows[0]
    })
  },

  async createRazorpayOrder({ amount, receipt, notes }) {
    return createOrder({ amount, receipt, notes })
  },

  async verifyRazorpayPayment(payload) {
    verifyPaymentSignature(payload)
    return true
  },

  async findByRazorpayOrderId(orderId) {
    return queryOne(`select ${COLS} from public.${TABLE} where razorpay_order_id = $1`, [orderId])
  },

  async list({ page = 1, limit = 20, revenueCategory } = {}) {
    const offset = (page - 1) * limit

    const rows = await query(
      `select ${COLS}, count(*) over ()::int as total_count
         from public.${TABLE}
        where ($1::text is null or revenue_category = $1)
        order by created_at desc
        limit $2 offset $3`,
      [revenueCategory ?? null, limit, offset],
    )

    return {
      items: rows,
      total: rows.length ? Number(rows[0].total_count) : 0,
      page,
      limit,
    }
  },

  async revenueSummary({ from, to }) {
    const rows = await query(
      `select revenue_category, sum(amount)::numeric as total, count(*)::int as count
         from public.${TABLE}
        where status = 'success'
          and paid_at >= $1 and paid_at <= $2
        group by revenue_category
        order by revenue_category`,
      [from, to],
    )
    return rows
  },
}

export default paymentService