import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'
import { nextInvoiceNo } from '../utils/numbering.js'
import { round2, calcExclusiveTax } from '../utils/money.js'
import { toClubDate } from '../utils/clubTime.js'

// Clients
export const clientRepository = {
  async list() {
    let items = memoryStore.find('clients')
    items.sort((a, b) => a.name.localeCompare(b.name))
    return items
  },

  async findById(id) {
    return memoryStore.findOne('clients', (c) => c.id === id)
  },

  async create(data) {
    return memoryStore.insert('clients', {
      id: data.id || crypto.randomUUID(),
      name: data.name,
      contact_person: data.contactPerson || data.contact_person || null,
      email: data.email || null,
      phone: data.phone || null,
      gst_no: data.gstNo || data.gst_no || null,
      address: data.address || null,
      created_at: new Date().toISOString(),
    })
  },

  async update(id, updates) {
    return memoryStore.update('clients', (c) => c.id === id, updates)
  },
}

// Invoices
export const invoiceRepository = {
  async insert(data) {
    const invoiceNo = data.invoiceNo || data.invoice_no || nextInvoiceNo()
    return memoryStore.insert('invoices', {
      id: data.id || crypto.randomUUID(),
      invoice_no: invoiceNo,
      client_id: data.clientId || data.client_id || null,
      member_id: data.memberId || data.member_id || null,
      category: data.category || 'corporate',
      issue_date: data.issueDate || data.issue_date || toClubDate(),
      due_date: data.dueDate || data.due_date || toClubDate(),
      status: data.status || 'draft',
      subtotal: Number(data.subtotal || 0),
      tax_amount: Number(data.taxAmount || data.tax_amount || 0),
      total: Number(data.total || 0),
      paid_amount: Number(data.paidAmount || data.paid_amount || 0),
      notes: data.notes || null,
      created_by: data.createdBy || data.created_by || null,
      created_at: new Date().toISOString(),
    })
  },

  async addItems(items) {
    const created = []
    for (const item of items) {
      const doc = memoryStore.insert('invoice_items', {
        id: crypto.randomUUID(),
        invoice_id: item.invoiceId || item.invoice_id,
        description: item.description,
        qty: Number(item.qty || 1),
        unit_price: Number(item.unitPrice || item.unit_price),
        tax_rate_pct: Number(item.taxRatePct ?? item.tax_rate_pct ?? 18),
        amount: Number(item.amount || 0),
      })
      created.push(doc)
    }
    return created
  },

  async findById(id) {
    const inv = memoryStore.findOne('invoices', (i) => i.id === id)
    if (!inv) return null
    const items = memoryStore.find('invoice_items', (item) => item.invoice_id === id)
    return { ...inv, items }
  },

  async list(filters = {}) {
    let items = memoryStore.find('invoices')
    if (filters.status) items = items.filter((i) => i.status === filters.status)
    if (filters.clientId) items = items.filter((i) => i.client_id === filters.clientId)
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return items
  },

  async update(id, updates) {
    return memoryStore.update('invoices', (i) => i.id === id, updates)
  },
}

// Expenses
export const expenseRepository = {
  async insert(data) {
    return memoryStore.insert('expenses', {
      id: data.id || crypto.randomUUID(),
      vendor: data.vendor,
      category: data.category || 'other',
      description: data.description || null,
      amount: Number(data.amount || 0),
      tax_amount: Number(data.taxAmount || data.tax_amount || 0),
      due_date: data.dueDate || data.due_date || toClubDate(),
      status: data.status || 'unpaid',
      paid_at: data.paidAt || data.paid_at || null,
      payment_method: data.paymentMethod || data.payment_method || null,
      created_by: data.createdBy || data.created_by || null,
      created_at: new Date().toISOString(),
    })
  },

  async findById(id) {
    return memoryStore.findOne('expenses', (e) => e.id === id)
  },

  async list(filters = {}) {
    let items = memoryStore.find('expenses')
    if (filters.status) items = items.filter((e) => e.status === filters.status)
    if (filters.category) items = items.filter((e) => e.category === filters.category)
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return items
  },

  async update(id, updates) {
    return memoryStore.update('expenses', (e) => e.id === id, updates)
  },
}

export default {
  clientRepository,
  invoiceRepository,
  expenseRepository,
}
