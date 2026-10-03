import crypto, { randomUUID } from 'crypto'

/**
 * In-memory fallback repository store.
 * Allows all modules to run with 100% offline isolation or against Postgres.
 */
class MemoryStore {
  constructor() {
    this.reset()
  }

  reset() {
    this.collections = {
      users: [],
      settings: [],
      plans: [],
      members: [],
      memberships: [],
      courts: [],
      bookings: [],
      booking_participants: [],
      payments: [],
      notifications: [],
      product_categories: [],
      products: [],
      stock_movements: [],
      shop_orders: [],
      shop_order_items: [],
      menu_items: [],
      bar_tables: [],
      bar_tabs: [],
      bar_order_items: [],
      leads: [],
      lead_activities: [],
      quotes: [],
      clients: [],
      invoices: [],
      invoice_items: [],
      expenses: [],
      employees: [],
      shifts: [],
      leave_requests: [],
      payroll_runs: [],
      payslips: [],
    }
  }

  get(collection) {
    if (!this.collections[collection]) {
      this.collections[collection] = []
    }
    return this.collections[collection]
  }

  insert(collection, item) {
    const list = this.get(collection)
    const doc = {
      id: item.id || crypto.randomUUID(),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item,
    }
    list.push(doc)
    return { ...doc }
  }

  find(collection, filterFn = () => true) {
    const list = this.get(collection)
    return list.filter(filterFn).map((doc) => ({ ...doc }))
  }

  findOne(collection, filterFn = () => true) {
    const list = this.get(collection)
    const found = list.find(filterFn)
    return found ? { ...found } : null
  }

  update(collection, filterFn, updates) {
    const list = this.get(collection)
    let updatedCount = 0
    let lastUpdated = null

    for (let i = 0; i < list.length; i++) {
      if (filterFn(list[i])) {
        list[i] = {
          ...list[i],
          ...updates,
          updated_at: new Date().toISOString(),
        }
        lastUpdated = list[i]
        updatedCount++
      }
    }
    return lastUpdated ? { ...lastUpdated } : null
  }

  delete(collection, filterFn) {
    const list = this.get(collection)
    const initialLen = list.length
    this.collections[collection] = list.filter((item) => !filterFn(item))
    return initialLen - this.collections[collection].length
  }
}

export const memoryStore = new MemoryStore()
export default memoryStore
