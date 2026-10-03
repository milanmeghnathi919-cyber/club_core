import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'
import { nextTabNo } from '../utils/numbering.js'

export const barRepository = {
  // Menu
  async listMenu({ isAvailable } = {}) {
    try {
      const sql = isAvailable !== undefined
        ? 'select * from public.menu_items where is_available = $1 order by name asc'
        : 'select * from public.menu_items order by name asc'
      const rows = await query(sql, isAvailable !== undefined ? [isAvailable] : [])
      if (rows && rows.length > 0) return rows
    } catch (err) {
      console.error('[barRepository.listMenu DB error]', err.message)
    }

    let items = memoryStore.find('menu_items')
    if (isAvailable !== undefined) items = items.filter((m) => m.is_available === isAvailable)
    items.sort((a, b) => a.name.localeCompare(b.name))
    return items
  },

  async findMenuItemById(id) {
    return memoryStore.findOne('menu_items', (m) => m.id === id)
  },

  async createMenuItem(data) {
    try {
      const row = await queryOne(
        `insert into public.menu_items
           (name, category, price, tax_rate_pct, station, is_available, image_url)
         values ($1, $2, $3, $4, $5, $6, $7)
         returning *`,
        [
          data.name,
          data.category || 'Coffee & Brews',
          Number(data.price),
          Number(data.taxRatePct ?? data.tax_rate_pct ?? (data.category?.toLowerCase().includes('food') ? 5 : 18)),
          data.station || (data.category?.toLowerCase().includes('food') ? 'kitchen' : 'bar'),
          data.isAvailable ?? data.is_available ?? true,
          data.imageUrl || data.image_url || null,
        ]
      )
      if (row) {
        memoryStore.insert('menu_items', row)
        return row
      }
    } catch (err) {
      console.error('[barRepository.createMenuItem DB error]', err.message)
    }

    return memoryStore.insert('menu_items', {
      id: data.id || crypto.randomUUID(),
      name: data.name,
      category: data.category || 'Coffee & Brews',
      price: Number(data.price),
      tax_rate_pct: Number(data.taxRatePct ?? data.tax_rate_pct ?? 5),
      station: data.station || 'bar',
      is_available: data.isAvailable ?? data.is_available ?? true,
      image_url: data.imageUrl || data.image_url || null,
      created_at: new Date().toISOString(),
    })
  },

  async updateMenuItem(id, updates) {
    try {
      const sets = []
      const vals = []
      let idx = 1
      for (const [k, v] of Object.entries(updates)) {
        const col = k.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase())
        sets.push(`${col} = $${idx++}`)
        vals.push(v)
      }
      vals.push(id)
      const row = await queryOne(
        `update public.menu_items set ${sets.join(', ')} where id = $${idx} returning *`,
        vals
      )
      if (row) {
        memoryStore.update('menu_items', (m) => m.id === id, row)
        return row
      }
    } catch (err) {
      console.error('[barRepository.updateMenuItem DB error]', err.message)
    }
    return memoryStore.update('menu_items', (m) => m.id === id, updates)
  },

  async deleteMenuItem(id) {
    try {
      await query('delete from public.menu_items where id = $1', [id])
    } catch {}
    return memoryStore.delete('menu_items', (m) => m.id === id)
  },

  // Tables
  async listTables() {
    let items = memoryStore.find('bar_tables')
    items.sort((a, b) => a.label.localeCompare(b.label))
    return items
  },

  async findTableById(id) {
    return memoryStore.findOne('bar_tables', (t) => t.id === id)
  },

  async createTable(data) {
    return memoryStore.insert('bar_tables', {
      id: data.id || crypto.randomUUID(),
      label: data.label,
      seats: Number(data.seats || 4),
      is_active: data.isActive ?? data.is_active ?? true,
      created_at: new Date().toISOString(),
    })
  },

  // Tabs
  async findOpenTabByTableId(tableId) {
    if (!tableId) return null
    return memoryStore.findOne('bar_tabs', (t) => t.table_id === tableId && t.status === 'open')
  },

  async createTab(data) {
    const tabNo = data.tabNo || data.tab_no || nextTabNo()
    return memoryStore.insert('bar_tabs', {
      id: data.id || crypto.randomUUID(),
      tab_no: tabNo,
      table_id: data.tableId || data.table_id || null,
      member_id: data.memberId || data.member_id || null,
      guest_name: data.guestName || data.guest_name || null,
      status: 'open',
      opened_by: data.openedBy || data.opened_by || null,
      settled_by: null,
      subtotal: 0,
      discount_pct: 0,
      discount: 0,
      tax_amount: 0,
      total: 0,
      void_reason: null,
      opened_at: new Date().toISOString(),
      closed_at: null,
      created_at: new Date().toISOString(),
    })
  },

  async findTabById(id) {
    const tab = memoryStore.findOne('bar_tabs', (t) => t.id === id)
    if (!tab) return null
    const items = memoryStore.find('bar_order_items', (i) => i.tab_id === id)
    return { ...tab, items }
  },

  async listTabs({ status = null } = {}) {
    let items = memoryStore.find('bar_tabs')
    if (status) items = items.filter((t) => t.status === status)
    items.sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at))
    return items
  },

  async updateTab(id, updates) {
    return memoryStore.update('bar_tabs', (t) => t.id === id, updates)
  },

  // Tab items
  async addTabItem(data) {
    return memoryStore.insert('bar_order_items', {
      id: data.id || crypto.randomUUID(),
      tab_id: data.tabId || data.tab_id,
      menu_item_id: data.menuItemId || data.menu_item_id,
      name_snapshot: data.nameSnapshot || data.name_snapshot,
      unit_price: Number(data.unitPrice || data.unit_price),
      qty: Number(data.qty || 1),
      tax_rate_pct: Number(data.taxRatePct ?? data.tax_rate_pct ?? 18),
      notes: data.notes || null,
      kitchen_status: 'new',
      station: data.station || 'kitchen',
      added_by: data.addedBy || data.added_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  },

  async findTabItemById(id) {
    return memoryStore.findOne('bar_order_items', (i) => i.id === id)
  },

  async updateTabItem(id, updates) {
    return memoryStore.update('bar_order_items', (i) => i.id === id, {
      ...updates,
      updated_at: new Date().toISOString(),
    })
  },

  async removeTabItem(id) {
    return memoryStore.delete('bar_order_items', (i) => i.id === id)
  },

  async getKitchenQueue(station = null) {
    let items = memoryStore.find('bar_order_items', (i) => ['new', 'preparing', 'ready'].includes(i.kitchen_status))
    if (station) items = items.filter((i) => i.station === station)
    items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Oldest first
    return items
  },
}

export default barRepository
