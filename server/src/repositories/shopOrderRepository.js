import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'
import { nextOrderNo } from '../utils/numbering.js'

export const shopOrderRepository = {
  async insert(data) {
    const orderNo = data.orderNo || data.order_no || nextOrderNo()
    try {
      const row = await queryOne(
        `insert into public.shop_orders
           (order_no, member_id, customer_name, customer_phone, channel, fulfilment,
            delivery_address, delivery_fee, status, payment_status, payment_pref,
            subtotal, discount_pct, discount, tax_amount, total, notes, expires_at, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         returning *`,
        [
          orderNo,
          data.memberId || data.member_id || null,
          data.customerName || data.customer_name,
          data.customerPhone || data.customer_phone || null,
          data.channel || 'counter',
          data.fulfilment || 'in_store',
          data.deliveryAddress || data.delivery_address || null,
          data.deliveryFee ?? data.delivery_fee ?? 0,
          data.status || 'pending',
          data.paymentStatus || data.payment_status || 'unpaid',
          data.paymentPref || data.payment_pref || null,
          data.subtotal || 0,
          data.discountPct ?? data.discount_pct ?? 0,
          data.discount || 0,
          data.taxAmount ?? data.tax_amount ?? 0,
          data.total || 0,
          data.notes || null,
          data.expiresAt || data.expires_at || null,
          data.createdBy || data.created_by || null,
        ]
      )
      if (row) {
        memoryStore.insert('shop_orders', row)
        return row
      }
    } catch {}

    return memoryStore.insert('shop_orders', {
      id: data.id || crypto.randomUUID(),
      order_no: orderNo,
      member_id: data.memberId || data.member_id || null,
      customer_name: data.customerName || data.customer_name,
      customer_phone: data.customerPhone || data.customer_phone || null,
      channel: data.channel || 'counter',
      fulfilment: data.fulfilment || 'in_store',
      delivery_address: data.deliveryAddress || data.delivery_address || null,
      delivery_fee: Number(data.deliveryFee ?? data.delivery_fee ?? 0),
      status: data.status || 'pending',
      payment_status: data.paymentStatus || data.payment_status || 'unpaid',
      payment_pref: data.paymentPref || data.payment_pref || null,
      subtotal: Number(data.subtotal || 0),
      discount_pct: Number(data.discountPct ?? data.discount_pct ?? 0),
      discount: Number(data.discount || 0),
      tax_amount: Number(data.taxAmount ?? data.tax_amount ?? 0),
      total: Number(data.total || 0),
      notes: data.notes || null,
      expires_at: data.expiresAt || data.expires_at || null,
      created_by: data.createdBy || data.created_by || null,
      created_at: new Date().toISOString(),
    })
  },

  async addItems(items) {
    const created = []
    for (const item of items) {
      try {
        const row = await queryOne(
          `insert into public.shop_order_items
             (order_id, product_id, name_snapshot, unit_price, qty, tax_rate_pct, tax_amount, line_total)
           values ($1,$2,$3,$4,$5,$6,$7,$8)
           returning *`,
          [
            item.orderId || item.order_id,
            item.productId || item.product_id,
            item.nameSnapshot || item.name_snapshot,
            item.unitPrice || item.unit_price,
            item.qty,
            item.taxRatePct ?? item.tax_rate_pct ?? 18,
            item.taxAmount ?? item.tax_amount ?? 0,
            item.lineTotal || item.line_total,
          ]
        )
        if (row) {
          memoryStore.insert('shop_order_items', row)
          created.push(row)
          continue
        }
      } catch {}

      const doc = memoryStore.insert('shop_order_items', {
        id: crypto.randomUUID(),
        order_id: item.orderId || item.order_id,
        product_id: item.productId || item.product_id,
        name_snapshot: item.nameSnapshot || item.name_snapshot,
        unit_price: Number(item.unitPrice || item.unit_price),
        qty: Number(item.qty),
        tax_rate_pct: Number(item.taxRatePct ?? item.tax_rate_pct ?? 18),
        tax_amount: Number(item.taxAmount ?? item.tax_amount ?? 0),
        line_total: Number(item.lineTotal || item.line_total),
      })
      created.push(doc)
    }
    return created
  },

  async findById(id) {
    let order = null
    try {
      order = await queryOne('select * from public.shop_orders where id = $1', [id])
    } catch {}
    if (!order) order = memoryStore.findOne('shop_orders', (o) => o.id === id)
    if (!order) return null

    let items = []
    try {
      items = await query('select * from public.shop_order_items where order_id = $1', [id])
    } catch {}
    if (!items || items.length === 0) {
      items = memoryStore.find('shop_order_items', (i) => i.order_id === id)
    }

    return { ...order, items }
  },

  async list({ memberId, status, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit
    let items = memoryStore.find('shop_orders')

    if (memberId) items = items.filter((o) => o.member_id === memberId)
    if (status) items = items.filter((o) => o.status === status)

    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
    }
  },

  async update(id, updates) {
    try {
      const sets = []
      const vals = []
      let idx = 1
      for (const [k, v] of Object.entries(updates)) {
        sets.push(`${k} = $${idx++}`)
        vals.push(v)
      }
      vals.push(id)
      const row = await queryOne(`update public.shop_orders set ${sets.join(', ')} where id = $${idx} returning *`, vals)
      if (row) {
        memoryStore.update('shop_orders', (o) => o.id === id, row)
        return row
      }
    } catch {}

    return memoryStore.update('shop_orders', (o) => o.id === id, updates)
  },
}

export default shopOrderRepository
