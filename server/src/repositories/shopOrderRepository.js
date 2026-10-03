import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'
import { nextOrderNo } from '../utils/numbering.js'

export const shopOrderRepository = {
  async insert(data) {
    const orderNo = data.orderNo || data.order_no || nextOrderNo()
    const rawFulfilment = data.fulfilment || data.fulfilment_type || 'pickup'
    const fulfilment = rawFulfilment === 'delivery' ? 'delivery' : 'pickup'

    const rawPref = data.paymentPref || data.payment_pref
    const paymentPref = ['prepaid', 'on_delivery'].includes(rawPref)
      ? rawPref
      : (data.paymentStatus === 'paid' ? 'prepaid' : 'on_delivery')

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
          fulfilment,
          data.deliveryAddress || data.delivery_address || null,
          data.deliveryFee ?? data.delivery_fee ?? 0,
          data.status || 'pending',
          data.paymentStatus || data.payment_status || 'unpaid',
          paymentPref,
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
    } catch (err) {
      console.error('[shopOrderRepository.insert error]', err.message)
    }

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

  async list({ memberId, createdBy, status, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit
    try {
      const whereClauses = []
      const params = []
      let pIdx = 1

      if (memberId && createdBy) {
        whereClauses.push(`(member_id = $${pIdx} or created_by = $${pIdx + 1})`)
        params.push(memberId, createdBy)
        pIdx += 2
      } else if (memberId) {
        whereClauses.push(`member_id = $${pIdx++}`)
        params.push(memberId)
      } else if (createdBy) {
        whereClauses.push(`created_by = $${pIdx++}`)
        params.push(createdBy)
      }

      if (status) {
        whereClauses.push(`status = $${pIdx++}`)
        params.push(status)
      }

      const whereSql = whereClauses.length > 0 ? `where ${whereClauses.join(' and ')}` : ''
      const countRes = await query(`select count(*)::int as total from public.shop_orders ${whereSql}`, params)
      const total = countRes[0]?.total || 0

      const rows = await query(
        `select * from public.shop_orders ${whereSql} order by created_at desc limit $${pIdx++} offset $${pIdx++}`,
        [...params, limit, offset]
      )

      if (rows) {
        const orderIds = rows.map((r) => r.id)
        let itemsMap = {}
        if (orderIds.length > 0) {
          try {
            const itemsRows = await query(
              `select oi.*, p.image_url, p.sku 
               from public.shop_order_items oi 
               left join public.products p on p.id = oi.product_id 
               where oi.order_id = any($1)`,
              [orderIds]
            )
            if (itemsRows) {
              itemsRows.forEach((item) => {
                if (!itemsMap[item.order_id]) itemsMap[item.order_id] = []
                itemsMap[item.order_id].push(item)
              })
            }
          } catch {}
        }

        const itemsWithDetails = rows.map((r) => ({
          ...r,
          items: itemsMap[r.id] || [],
        }))

        return {
          items: itemsWithDetails,
          total,
        }
      }
    } catch (err) {
      console.error('[shopOrderRepository.list DB error]', err.message)
    }

    let items = memoryStore.find('shop_orders')
    if (memberId && createdBy) {
      items = items.filter((o) => o.member_id === memberId || o.created_by === createdBy)
    } else if (memberId) {
      items = items.filter((o) => o.member_id === memberId)
    } else if (createdBy) {
      items = items.filter((o) => o.created_by === createdBy)
    }
    if (status) items = items.filter((o) => o.status === status)

    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const paged = items.slice(offset, offset + limit).map((o) => {
      const orderItems = memoryStore.find('shop_order_items', (i) => i.order_id === o.id)
      return { ...o, items: orderItems }
    })
    return {
      items: paged,
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
