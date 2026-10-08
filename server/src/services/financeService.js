import { clientRepository, invoiceRepository, expenseRepository } from '../repositories/financeRepository.js'
import paymentsService from './paymentsService.js'
import ApiError from '../utils/ApiError.js'
import { round2, calcExclusiveTax } from '../utils/money.js'
import { toClubDate } from '../utils/clubTime.js'

export const financeService = {
  // Clients
  async listClients() {
    return clientRepository.list()
  },

  async createClient(data) {
    return clientRepository.create(data)
  },

  async updateClient(id, data) {
    const client = await clientRepository.findById(id)
    if (!client) throw new ApiError(404, 'Client not found', null, 'NOT_FOUND')
    return clientRepository.update(id, data)
  },

  // Invoices
  async listInvoices(filters = {}) {
    const list = await invoiceRepository.list(filters)
    const today = toClubDate()
    return list.map((inv) => ({
      ...inv,
      overdue: inv.due_date < today && inv.status !== 'paid' && inv.status !== 'void',
      balance: round2(Number(inv.total) - Number(inv.paid_amount || 0)),
    }))
  },

  async getInvoice(id) {
    const inv = await invoiceRepository.findById(id)
    if (!inv) throw new ApiError(404, 'Invoice not found', null, 'NOT_FOUND')

    const today = toClubDate()
    return {
      ...inv,
      overdue: inv.due_date < today && inv.status !== 'paid' && inv.status !== 'void',
      balance: round2(Number(inv.total) - Number(inv.paid_amount || 0)),
    }
  },

  async createInvoice({
    clientId = null,
    memberId = null,
    category = 'corporate',
    issueDate = toClubDate(),
    dueDate,
    items = [],
    notes = null,
    actorId = null,
  }) {
    if (!clientId && !memberId) {
      throw new ApiError(422, 'Invoice requires a client or member', null, 'VALIDATION_ERROR')
    }
    if (!items || items.length === 0) {
      throw new ApiError(422, 'Invoice must include at least one item', null, 'EMPTY_INVOICE')
    }

    let subtotal = 0
    let taxAmount = 0
    const calculatedItems = []

    // BR-18 assumption: Invoice items are tax-EXCLUSIVE
    for (const item of items) {
      const lineSubtotal = round2(Number(item.unitPrice) * Number(item.qty || 1))
      const rate = Number(item.taxRatePct ?? 18)
      const lineTax = calcExclusiveTax(lineSubtotal, rate)

      subtotal += lineSubtotal
      taxAmount += lineTax

      calculatedItems.push({
        description: item.description,
        qty: Number(item.qty || 1),
        unitPrice: Number(item.unitPrice),
        taxRatePct: rate,
        taxAmount: lineTax,
        amount: round2(lineSubtotal + lineTax),
      })
    }

    subtotal = round2(subtotal)
    taxAmount = round2(taxAmount)
    const total = round2(subtotal + taxAmount)

    const invoice = await invoiceRepository.insert({
      clientId,
      memberId,
      category,
      issueDate,
      dueDate: dueDate || issueDate,
      status: 'draft',
      subtotal,
      taxAmount,
      total,
      paidAmount: 0,
      notes,
      createdBy: actorId,
    })

    await invoiceRepository.addItems(
      calculatedItems.map((ci) => ({ ...ci, invoiceId: invoice.id }))
    )

    return this.getInvoice(invoice.id)
  },

  async updateInvoice(id, updates) {
    await this.getInvoice(id)
    await invoiceRepository.update(id, updates)
    return this.getInvoice(id)
  },

  async payInvoice(id, { amount, method = 'bank_transfer', actorId }) {
    const inv = await this.getInvoice(id)
    if (inv.status === 'paid') return inv

    const payAmount = round2(Number(amount))
    if (payAmount <= 0) {
      throw new ApiError(422, 'Payment amount must be greater than 0', null, 'INVALID_AMOUNT')
    }

    if (payAmount > inv.balance + 0.01) {
      throw new ApiError(
        422,
        `Payment amount (₹${payAmount}) exceeds invoice balance (₹${inv.balance})`,
        null,
        'OVERPAYMENT'
      )
    }

    // Record into single revenue ledger
    await paymentsService.record({
      sourceType: 'invoice',
      sourceId: inv.id,
      amount: payAmount,
      method: ['cash', 'card', 'upi'].includes(method) ? method : 'card',
      category: inv.category === 'membership' ? 'membership' : 'corporate',
      revenueCategory: inv.category === 'membership' ? 'membership' : 'corporate',
      memberId: inv.member_id,
      receivedBy: actorId,
      status: 'paid',
    })

    const newPaid = round2(Number(inv.paid_amount || 0) + payAmount)
    const isFullyPaid = newPaid >= inv.total - 0.01

    await invoiceRepository.update(id, {
      paid_amount: newPaid,
      status: isFullyPaid ? 'paid' : 'sent',
    })

    return this.getInvoice(id)
  },

  // Expenses
  async listExpenses(filters = {}) {
    return expenseRepository.list(filters)
  },

  async createExpense(data, actorId) {
    return expenseRepository.insert({
      ...data,
      createdBy: actorId,
    })
  },

  async payExpense(id, { method = 'cash', actorId: _actorId }) {
    const exp = await expenseRepository.findById(id)
    if (!exp) throw new ApiError(404, 'Expense not found', null, 'NOT_FOUND')

    return expenseRepository.update(id, {
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: method,
    })
  },

  async getPayablesReport() {
    const expenses = await expenseRepository.list({ status: 'unpaid' })
    const today = toClubDate()

    let totalDue = 0
    let overdueAmount = 0
    const byCategory = {}

    for (const e of expenses) {
      const amt = Number(e.amount || 0)
      totalDue += amt
      if (e.due_date < today) {
        overdueAmount += amt
      }
      byCategory[e.category] = round2((byCategory[e.category] || 0) + amt)
    }

    return {
      totalDue: round2(totalDue),
      overdueAmount: round2(overdueAmount),
      byCategory,
      items: expenses,
    }
  },
}

export default financeService
