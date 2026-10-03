import memoryStore from '../utils/memoryStore.js'
import shopService from '../services/shopService.js'

export const releaseUnpaidOrders = async () => {
  const now = new Date().toISOString()
  const expiredOrders = memoryStore.find(
    'shop_orders',
    (o) =>
      o.status === 'pending' &&
      o.payment_status === 'unpaid' &&
      o.channel === 'online' &&
      o.expires_at &&
      o.expires_at < now
  )

  let releasedCount = 0
  for (const order of expiredOrders) {
    try {
      await shopService.cancel(order.id, 'system', true)
      releasedCount++
    } catch (err) {
      console.error(`Failed to cancel expired order ${order.id}:`, err)
    }
  }

  return { releasedCount }
}

export default releaseUnpaidOrders
