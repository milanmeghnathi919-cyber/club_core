import shopOrderRepository from '../repositories/shopOrderRepository.js'
import productRepository from '../repositories/productRepository.js'
import productService from './productService.js'
import membershipService from './membershipService.js'
import settingsService from './settingsService.js'
import paymentsService from './paymentsService.js'
import ApiError from '../utils/ApiError.js'
import { round2, calcInclusiveTax } from '../utils/money.js'

export const shopService = {
  async quote({ items = [], memberId = null, fulfilment = 'in_store' }) {
    const settings = await settingsService.get()
    const deliveryFee = fulfilment === 'delivery' ? Number(settings.deliveryFee || 50) : 0

    let subtotal = 0
    let totalTax = 0
    const lines = []

    for (const item of items) {
      const product = await productRepository.findProductById(item.productId)
      if (!product) {
        throw new ApiError(404, `Product not found: ${item.productId}`, null, 'NOT_FOUND')
      }

      const unitPrice = Number(product.price)
      const qty = Number(item.qty)
      const lineTotal = round2(unitPrice * qty)
      const taxRate = Number(product.tax_rate_pct || 18)
      const lineTax = calcInclusiveTax(lineTotal, taxRate)

      subtotal += lineTotal
      totalTax += lineTax

      lines.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice,
        qty,
        taxRatePct: taxRate,
        taxAmount: lineTax,
        lineTotal,
      })
    }

    subtotal = round2(subtotal)
    let discountPct = 0
    if (memberId) {
      discountPct = await membershipService.discountFor(memberId, 'shop')
    }

    const discount = round2((subtotal * discountPct) / 100)
    const net = round2(subtotal - discount)
    const total = round2(net + deliveryFee)

    // BR-16: Tax calculation on discounted items
    const taxAmount = round2(calcInclusiveTax(net, 18))

    return {
      lines,
      subtotal,
      discountPct,
      discount,
      taxAmount,
      deliveryFee,
      total,
    }
  },

  async create({
    channel = 'counter',
    fulfilment = 'in_store',
    memberId = null,
    customerName,
    customerPhone = null,
    deliveryAddress = null,
    paymentMethod = 'pay_at_club',
    items = [],
    notes = null,
    actorId = null,
  }) {
    if (!items || items.length === 0) {
      throw new ApiError(422, 'Order must include at least one item', null, 'EMPTY_ORDER')
    }

    if (fulfilment === 'delivery' && !deliveryAddress) {
      throw new ApiError(422, 'Delivery address is required for delivery orders', null, 'VALIDATION_ERROR')
    }

    // BR-11: Atomic stock check first for ALL items
    for (const item of items) {
      const product = await productRepository.findProductById(item.productId)
      if (!product || !product.is_active) {
        throw new ApiError(404, `Product not found or inactive: ${item.productId}`, null, 'NOT_FOUND')
      }
      const currentStock = Number(product.stock_qty || 0)
      if (currentStock < Number(item.qty)) {
        throw new ApiError(
          409,
          `Not enough stock for ${product.name} (requested: ${item.qty}, available: ${currentStock})`,
          null,
          'OUT_OF_STOCK'
        )
      }
    }

    // Calculate totals
    const quote = await this.quote({ items, memberId, fulfilment })

    // Decrement stock for all items
    for (const item of items) {
      await productService.adjustStock(item.productId, {
        delta: -Number(item.qty),
        reason: 'sale',
        note: `Order sale`,
        actorId,
      })
    }

    const settings = await settingsService.get()
    const holdMinutes = settings.onlineOrderHoldMinutes || 30

    let status = 'pending'
    let paymentStatus = 'unpaid'
    let expiresAt = null

    if (channel === 'counter' && ['cash', 'card', 'upi'].includes(paymentMethod)) {
      status = 'completed'
      paymentStatus = 'paid'
    } else if (channel === 'online' && paymentMethod === 'pay_at_club') {
      status = 'confirmed'
      paymentStatus = 'unpaid'
    } else {
      // online unpaid hold
      status = 'pending'
      paymentStatus = 'unpaid'
      const exp = new Date()
      exp.setMinutes(exp.getMinutes() + holdMinutes)
      expiresAt = exp.toISOString()
    }

    const order = await shopOrderRepository.insert({
      memberId,
      customerName,
      customerPhone,
      channel,
      fulfilment,
      deliveryAddress,
      deliveryFee: quote.deliveryFee,
      status,
      paymentStatus,
      paymentPref: paymentMethod,
      subtotal: quote.subtotal,
      discountPct: quote.discountPct,
      discount: quote.discount,
      taxAmount: quote.taxAmount,
      total: quote.total,
      notes,
      expiresAt,
      createdBy: actorId,
    })

    const orderItems = quote.lines.map((l) => ({
      orderId: order.id,
      productId: l.productId,
      nameSnapshot: l.name,
      unitPrice: l.unitPrice,
      qty: l.qty,
      taxRatePct: l.taxRatePct,
      taxAmount: l.taxAmount,
      lineTotal: l.lineTotal,
    }))
    await shopOrderRepository.addItems(orderItems)

    // If paid immediately, record into single revenue ledger
    if (paymentStatus === 'paid' && quote.total > 0) {
      await paymentsService.record({
        sourceType: 'shop_order',
        sourceId: order.id,
        amount: quote.total,
        method: paymentMethod,
        category: 'shop',
        revenueCategory: 'shop',
        memberId,
        receivedBy: actorId,
        taxAmount: quote.taxAmount,
        status: 'paid',
      })
    }

    return this.get(order.id)
  },

  async get(id) {
    const order = await shopOrderRepository.findById(id)
    if (!order) throw new ApiError(404, 'Order not found', null, 'NOT_FOUND')
    return order
  },

  async list(filters) {
    return shopOrderRepository.list(filters)
  },

  async updateStatus(id, newStatus, actorId) {
    const order = await this.get(id)
    const current = order.status

    const VALID_TRANSITIONS = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['ready', 'out_for_delivery', 'cancelled'],
      ready: ['completed', 'cancelled'],
      out_for_delivery: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    }

    if (!VALID_TRANSITIONS[current]?.includes(newStatus)) {
      throw new ApiError(
        409,
        `Invalid status transition from ${current} to ${newStatus}`,
        null,
        'INVALID_TRANSITION'
      )
    }

    if (newStatus === 'cancelled') {
      return this.cancel(id, actorId, true)
    }

    const updated = await shopOrderRepository.update(id, { status: newStatus })
    return this.get(id)
  },

  async pay(id, { method, actorId }) {
    const order = await this.get(id)
    if (order.payment_status === 'paid') return order

    await paymentsService.record({
      sourceType: 'shop_order',
      sourceId: order.id,
      amount: order.total,
      method,
      category: 'shop',
      revenueCategory: 'shop',
      memberId: order.member_id,
      receivedBy: actorId,
      taxAmount: order.tax_amount,
      status: 'paid',
    })

    await shopOrderRepository.update(id, {
      payment_status: 'paid',
      status: order.status === 'pending' ? 'confirmed' : order.status,
    })
    return this.get(id)
  },

  async cancel(id, actorId, isStaff = false) {
    const order = await this.get(id)
    if (order.status === 'cancelled') return order

    if (!isStaff && order.status !== 'pending') {
      throw new ApiError(409, 'Only pending orders can be cancelled by customers', null, 'CANNOT_CANCEL')
    }

    // Restore stock for all items
    for (const item of order.items || []) {
      await productService.adjustStock(item.product_id, {
        delta: Number(item.qty),
        reason: 'order_cancel',
        note: `Order ${order.order_no} cancelled`,
        actorId,
      })
    }

    let nextPaymentStatus = order.payment_status
    if (order.payment_status === 'paid') {
      nextPaymentStatus = 'refund_pending'
    }

    await shopOrderRepository.update(id, {
      status: 'cancelled',
      payment_status: nextPaymentStatus,
    })

    return this.get(id)
  },
}

export default shopService
