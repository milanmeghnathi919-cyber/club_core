import barRepository from '../repositories/barRepository.js'
import membershipService from './membershipService.js'
import paymentsService from './paymentsService.js'
import memoryStore from '../utils/memoryStore.js'
import ApiError from '../utils/ApiError.js'
import { round2, calcInclusiveTax } from '../utils/money.js'
import { toClubDate } from '../utils/clubTime.js'

export const barService = {
  // Menu
  async listMenu(isAvailable) {
    return barRepository.listMenu(isAvailable)
  },

  async createMenuItem(data) {
    return barRepository.createMenuItem(data)
  },

  async updateMenuItem(id, updates) {
    const item = await barRepository.findMenuItemById(id)
    if (!item) throw new ApiError(404, 'Menu item not found', null, 'NOT_FOUND')
    return barRepository.updateMenuItem(id, updates)
  },

  // Tables
  async listTables() {
    return barRepository.listTables()
  },

  async createTable(data) {
    return barRepository.createTable(data)
  },

  // Dynamic recalculation
  async recalculateTab(tabId) {
    const tab = await barRepository.findTabById(tabId)
    if (!tab) return null

    let subtotal = 0
    let totalTax = 0

    const activeItems = (tab.items || []).filter((i) => i.kitchen_status !== 'cancelled')
    for (const item of activeItems) {
      const lineTotal = round2(Number(item.unit_price) * Number(item.qty))
      const taxRate = Number(item.tax_rate_pct || 18)
      const lineTax = calcInclusiveTax(lineTotal, taxRate)

      subtotal += lineTotal
      totalTax += lineTax
    }

    subtotal = round2(subtotal)
    let discountPct = 0
    if (tab.member_id) {
      discountPct = await membershipService.discountFor(tab.member_id, 'bar', new Date(tab.opened_at))
    }

    const discount = round2((subtotal * discountPct) / 100)
    const total = round2(subtotal - discount)
    const taxAmount = round2(calcInclusiveTax(total, 18))

    const updated = await barRepository.updateTab(tabId, {
      subtotal,
      discount_pct: discountPct,
      discount,
      tax_amount: taxAmount,
      total,
    })

    return { ...tab, ...updated }
  },

  // Tabs
  async openTab({ tableId = null, memberId = null, guestName = null, actorId = null }) {
    if (tableId) {
      const occupied = await barRepository.findOpenTabByTableId(tableId)
      if (occupied) {
        throw new ApiError(409, 'This table is already occupied by an open tab', null, 'TABLE_OCCUPIED')
      }
    }

    const tab = await barRepository.createTab({
      tableId,
      memberId,
      guestName,
      openedBy: actorId,
    })

    return this.recalculateTab(tab.id)
  },

  async getTab(id) {
    const tab = await barRepository.findTabById(id)
    if (!tab) throw new ApiError(404, 'Tab not found', null, 'NOT_FOUND')
    return tab
  },

  async listTabs(filters) {
    return barRepository.listTabs(filters)
  },

  async addItem(tabId, { menuItemId, qty = 1, notes = null, actorId = null }) {
    const tab = await barRepository.findTabById(tabId)
    if (!tab) throw new ApiError(404, 'Tab not found', null, 'NOT_FOUND')
    if (tab.status !== 'open') throw new ApiError(409, 'Cannot add items to a closed tab', null, 'TAB_CLOSED')

    const menuItem = await barRepository.findMenuItemById(menuItemId)
    if (!menuItem) throw new ApiError(404, 'Menu item not found', null, 'NOT_FOUND')
    if (!menuItem.is_available) {
      throw new ApiError(409, 'This menu item is currently unavailable', null, 'ITEM_UNAVAILABLE')
    }

    await barRepository.addTabItem({
      tabId,
      menuItemId,
      nameSnapshot: menuItem.name,
      unitPrice: menuItem.price,
      qty: Number(qty) || 1,
      taxRatePct: menuItem.tax_rate_pct,
      station: menuItem.station,
      notes,
      addedBy: actorId,
    })

    return this.recalculateTab(tabId)
  },

  async updateItem(tabId, itemId, { qty, notes }) {
    const tab = await barRepository.findTabById(tabId)
    if (!tab || tab.status !== 'open') throw new ApiError(409, 'Tab is closed', null, 'TAB_CLOSED')

    const item = await barRepository.findTabItemById(itemId)
    if (!item) throw new ApiError(404, 'Item not found', null, 'NOT_FOUND')
    if (item.kitchen_status !== 'new') {
      throw new ApiError(409, 'Items already in preparation cannot be edited', null, 'CANNOT_EDIT_ITEM')
    }

    const updates = {}
    if (qty !== undefined) updates.qty = Number(qty)
    if (notes !== undefined) updates.notes = notes

    await barRepository.updateTabItem(itemId, updates)
    return this.recalculateTab(tabId)
  },

  async cancelItem(tabId, itemId, actorId) {
    const tab = await barRepository.findTabById(tabId)
    if (!tab || tab.status !== 'open') throw new ApiError(409, 'Tab is closed', null, 'TAB_CLOSED')

    const item = await barRepository.findTabItemById(itemId)
    if (!item) throw new ApiError(404, 'Item not found', null, 'NOT_FOUND')
    if (item.kitchen_status !== 'new') {
      throw new ApiError(409, 'Items in preparation cannot be cancelled', null, 'CANNOT_CANCEL_ITEM')
    }

    await barRepository.updateTabItem(itemId, { kitchen_status: 'cancelled' })
    return this.recalculateTab(tabId)
  },

  async attachMember(tabId, memberId) {
    const tab = await barRepository.findTabById(tabId)
    if (!tab || tab.status !== 'open') throw new ApiError(409, 'Tab is closed', null, 'TAB_CLOSED')

    await barRepository.updateTab(tabId, { member_id: memberId || null })
    return this.recalculateTab(tabId)
  },

  async moveTable(tabId, newTableId) {
    const tab = await barRepository.findTabById(tabId)
    if (!tab || tab.status !== 'open') throw new ApiError(409, 'Tab is closed', null, 'TAB_CLOSED')

    if (newTableId) {
      const occupied = await barRepository.findOpenTabByTableId(newTableId)
      if (occupied && occupied.id !== tabId) {
        throw new ApiError(409, 'The target table is already occupied', null, 'TABLE_OCCUPIED')
      }
    }

    await barRepository.updateTab(tabId, { table_id: newTableId || null })
    return this.recalculateTab(tabId)
  },

  async settle(tabId, { payments = [], actorId }) {
    const tab = await barRepository.findTabById(tabId)
    if (!tab) throw new ApiError(404, 'Tab not found', null, 'NOT_FOUND')
    if (tab.status !== 'open') throw new ApiError(409, 'Tab is already closed or void', null, 'TAB_CLOSED')

    const sumPayments = round2(payments.reduce((acc, p) => acc + Number(p.amount), 0))
    if (Math.abs(sumPayments - tab.total) > 0.01) {
      throw new ApiError(
        422,
        `Payment sum (₹${sumPayments}) does not match tab total (₹${tab.total})`,
        null,
        'AMOUNT_MISMATCH'
      )
    }

    // Record each payment into single ledger
    for (const p of payments) {
      await paymentsService.record({
        sourceType: 'bar_tab',
        sourceId: tab.id,
        amount: p.amount,
        method: p.method,
        category: 'bar',
        revenueCategory: 'bar',
        memberId: tab.member_id,
        receivedBy: actorId,
        taxAmount: tab.tax_amount,
        status: 'paid',
      })
    }

    const updated = await barRepository.updateTab(tabId, {
      status: 'settled',
      settled_by: actorId,
      closed_at: new Date().toISOString(),
    })

    return { ...tab, ...updated }
  },

  async voidTab(tabId, { reason, actorId }) {
    if (!reason) throw new ApiError(422, 'Void reason is required', null, 'VALIDATION_ERROR')
    const tab = await barRepository.findTabById(tabId)
    if (!tab) throw new ApiError(404, 'Tab not found', null, 'NOT_FOUND')

    const updated = await barRepository.updateTab(tabId, {
      status: 'void',
      void_reason: reason,
      closed_at: new Date().toISOString(),
    })

    return { ...tab, ...updated }
  },

  // Kitchen
  async getKitchenQueue(station) {
    return barRepository.getKitchenQueue(station)
  },

  async updateKitchenStatus(itemId, newStatus) {
    const item = await barRepository.findTabItemById(itemId)
    if (!item) throw new ApiError(404, 'Order item not found', null, 'NOT_FOUND')

    const ALLOWED = {
      new: ['preparing'],
      preparing: ['ready'],
      ready: ['served'],
      served: [],
    }

    if (!ALLOWED[item.kitchen_status]?.includes(newStatus)) {
      throw new ApiError(
        409,
        `Invalid kitchen status transition from ${item.kitchen_status} to ${newStatus}`,
        null,
        'INVALID_TRANSITION'
      )
    }

    const updated = await barRepository.updateTabItem(itemId, { kitchen_status: newStatus })
    return updated
  },

  // Summary
  async getSummary(date = toClubDate()) {
    const tabs = memoryStore.find('bar_tabs', (t) => t.opened_at && t.opened_at.startsWith(date))
    const settledTabs = tabs.filter((t) => t.status === 'settled')
    const voidedTabs = tabs.filter((t) => t.status === 'void')

    const gross = round2(settledTabs.reduce((acc, t) => acc + Number(t.subtotal || 0), 0))
    const discounts = round2(settledTabs.reduce((acc, t) => acc + Number(t.discount || 0), 0))
    const tax = round2(settledTabs.reduce((acc, t) => acc + Number(t.tax_amount || 0), 0))
    const net = round2(settledTabs.reduce((acc, t) => acc + Number(t.total || 0), 0))

    const payments = memoryStore.find(
      'payments',
      (p) => p.source_type === 'bar_tab' && p.status === 'paid' && p.paid_at && p.paid_at.startsWith(date)
    )

    const byMethod = {}
    for (const p of payments) {
      byMethod[p.method] = round2((byMethod[p.method] || 0) + Number(p.amount))
    }

    return {
      date,
      tabsCount: settledTabs.length,
      voidedCount: voidedTabs.length,
      gross,
      discounts,
      tax,
      net,
      byMethod,
    }
  },
}

export default barService
