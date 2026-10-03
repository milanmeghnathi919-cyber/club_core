import paymentRepository from '../repositories/paymentRepository.js'
import paymentsService from './paymentsService.js'
import courtRepository from '../repositories/courtRepository.js'
import memberRepository from '../repositories/memberRepository.js'
import { expenseRepository, invoiceRepository } from '../repositories/financeRepository.js'
import productRepository from '../repositories/productRepository.js'
import leadRepository from '../repositories/leadRepository.js'
import hrRepository from '../repositories/hrRepository.js'
import settingsService from './settingsService.js'
import memoryStore from '../utils/memoryStore.js'
import { toClubDate, localDayRange } from '../utils/clubTime.js'
import { round2 } from '../utils/money.js'
import { stringify } from 'csv-stringify/sync'

export const reportsService = {
  async getDashboard({ range = 'month', from = null, to = null, isOwner = true }) {
    const todayStr = toClubDate()
    let startDateStr = from
    let endDateStr = to || todayStr

    if (!startDateStr) {
      const today = new Date(todayStr)
      if (range === 'today') {
        startDateStr = todayStr
      } else if (range === 'week') {
        const d = new Date(today)
        d.setDate(d.getDate() - 6)
        startDateStr = toClubDate(d)
      } else {
        // month: last 30 days
        const d = new Date(today)
        d.setDate(d.getDate() - 29)
        startDateStr = toClubDate(d)
      }
    }

    const { startIso } = localDayRange(startDateStr)
    const { endIso } = localDayRange(endDateStr)

    // Payments in range
    const paidPayments = await paymentRepository.getPaidRows(startIso, endIso)
    const activePayments = paidPayments.filter((p) => p.status === 'paid')

    const totalRevenue = round2(activePayments.reduce((acc, p) => acc + Number(p.amount), 0))

    const bySource = { court: 0, shop: 0, bar: 0, membership: 0, corporate: 0, other: 0 }
    const byMethod = { cash: 0, card: 0, upi: 0, online: 0 }

    for (const p of activePayments) {
      const src = p.revenue_category || p.source_type || 'other'
      bySource[src] = round2((bySource[src] || 0) + Number(p.amount))

      const meth = p.method || 'cash'
      byMethod[meth] = round2((byMethod[meth] || 0) + Number(p.amount))
    }

    // Zero-filled daily series
    const dailyMap = {}
    const cur = new Date(startDateStr)
    const end = new Date(endDateStr)
    while (cur <= end) {
      dailyMap[toClubDate(cur)] = 0
      cur.setDate(cur.getDate() + 1)
    }

    for (const p of activePayments) {
      const d = toClubDate(p.paid_at || p.created_at)
      if (dailyMap[d] !== undefined) {
        dailyMap[d] = round2(dailyMap[d] + Number(p.amount))
      }
    }

    const dailySeries = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }))

    // Compare with previous equal period
    const periodDays = Math.max(1, Math.round((new Date(endDateStr) - new Date(startDateStr)) / (1000 * 60 * 60 * 24)) + 1)
    const prevEndDate = new Date(startDateStr)
    prevEndDate.setDate(prevEndDate.getDate() - 1)
    const prevStartDate = new Date(prevEndDate)
    prevStartDate.setDate(prevStartDate.getDate() - periodDays + 1)

    const { startIso: prevStartIso } = localDayRange(toClubDate(prevStartDate))
    const { endIso: prevEndIso } = localDayRange(toClubDate(prevEndDate))
    const prevPayments = (await paymentRepository.getPaidRows(prevStartIso, prevEndIso)).filter((p) => p.status === 'paid')
    const previousTotal = round2(prevPayments.reduce((acc, p) => acc + Number(p.amount), 0))

    const changePct = previousTotal > 0
      ? round2(((totalRevenue - previousTotal) / previousTotal) * 100)
      : totalRevenue > 0 ? 100 : 0

    // Bookings & utilisation
    const allBookings = memoryStore.find('bookings', (b) => b.start_at >= startIso && b.start_at <= endIso)
    const confirmedBookings = allBookings.filter((b) => b.status === 'confirmed' || b.status === 'completed')
    const cancelledBookings = allBookings.filter((b) => b.status === 'cancelled')

    const courts = await courtRepository.list({ isActive: true })
    const courtCount = Math.max(1, courts.length)
    // Daily available slot-hours: 06:00 to 22:00 = 16 hours per court
    const totalAvailableHours = periodDays * courtCount * 16
    const bookedHours = confirmedBookings.length * 1 // each is 60 min = 1 hour
    const utilisationPct = totalAvailableHours > 0 ? round2((bookedHours / totalAvailableHours) * 100) : 0

    // Members
    const activeMemberships = memoryStore.find('memberships', (m) => m.status === 'active')
    const allMembers = memoryStore.find('members')
    const newMembersInRange = allMembers.filter((m) => m.created_at >= startIso && m.created_at <= endIso).length

    const todayDate = new Date(todayStr)
    const in7DaysDate = new Date(todayStr)
    in7DaysDate.setDate(in7DaysDate.getDate() + 7)
    const in7DaysStr = toClubDate(in7DaysDate)

    const expiringIn7Days = activeMemberships.filter(
      (m) => m.end_date >= todayStr && m.end_date <= in7DaysStr
    ).length

    // Alerts
    const products = memoryStore.find('products', (p) => p.is_active !== false)
    const lowStockCount = products.filter((p) => Number(p.stock_qty || 0) <= Number(p.low_stock_threshold || 5)).length

    const leads = memoryStore.find('leads')
    const openLeads = leads.filter((l) => l.status === 'new' || l.status === 'contacted').length
    const overdueFollowUps = leads.filter(
      (l) => l.follow_up_at && l.follow_up_at < todayStr && l.status !== 'won' && l.status !== 'lost'
    ).length

    const pendingLeave = memoryStore.find('leave_requests', (l) => l.status === 'pending').length
    const unpaidExpenses = memoryStore.find('expenses', (e) => e.status === 'unpaid').length
    const overdueInvoices = memoryStore.find('invoices', (i) => i.status !== 'paid' && i.status !== 'void' && i.due_date < todayStr).length

    const alerts = {
      lowStockCount,
      openLeads,
      overdueFollowUps,
      pendingLeave,
      payablesDue: isOwner ? unpaidExpenses : undefined,
      overdueInvoices: isOwner ? overdueInvoices : undefined,
    }

    return {
      revenue: {
        total: totalRevenue,
        bySource,
        byMethod,
        dailySeries,
        compare: {
          previousTotal,
          changePct,
        },
      },
      bookings: {
        count: confirmedBookings.length,
        utilisationPct,
        cancelled: cancelledBookings.length,
      },
      members: {
        active: activeMemberships.length,
        newInRange: newMembersInRange,
        expiringIn7Days,
      },
      alerts,
    }
  },

  async getRevenueReport({ groupBy = 'day', from = null, to = null }) {
    return paymentsService.sumPaid({ from, to, groupBy })
  },

  async getTaxReport({ from = null, to = null } = {}) {
    const paidPayments = await paymentRepository.getPaidRows(from, to)
    const activePayments = paidPayments.filter((p) => p.status === 'paid')

    let totalOutputTax = 0
    const byCategory = {}

    for (const p of activePayments) {
      const tax = Number(p.tax_amount || 0)
      totalOutputTax += tax
      const cat = p.revenue_category || 'court'
      byCategory[cat] = round2((byCategory[cat] || 0) + tax)
    }

    // Input tax from expenses
    const paidExpenses = memoryStore.find('expenses', (e) => e.status === 'paid')
    const totalInputTax = round2(paidExpenses.reduce((acc, e) => acc + Number(e.tax_amount || 0), 0))

    totalOutputTax = round2(totalOutputTax)
    const netPayable = round2(totalOutputTax - totalInputTax)

    return {
      outputTax: [
        {
          ratePct: 18,
          taxableValue: round2(totalOutputTax / 0.18),
          tax: totalOutputTax,
        },
      ],
      inputTax: totalInputTax,
      netPayable,
      byCategory,
    }
  },

  async exportCsv(type) {
    let data = []
    let filename = `${type}_export_${toClubDate()}.csv`

    if (type === 'revenue' || type === 'payments') {
      const payments = memoryStore.find('payments')
      data = payments.map((p) => ({
        PaymentNo: p.payment_no,
        Source: p.source_type,
        Amount: p.amount,
        Method: p.method,
        Status: p.status,
        Category: p.revenue_category,
        Tax: p.tax_amount,
        PaidAt: p.paid_at,
      }))
    } else if (type === 'members') {
      const members = memoryStore.find('members')
      data = members.map((m) => ({
        MemberCode: m.member_code,
        Name: m.full_name,
        Phone: m.phone,
        Email: m.email,
        CreatedAt: m.created_at,
      }))
    } else if (type === 'payables') {
      const expenses = memoryStore.find('expenses')
      data = expenses.map((e) => ({
        Vendor: e.vendor,
        Category: e.category,
        Amount: e.amount,
        DueDate: e.due_date,
        Status: e.status,
      }))
    } else {
      data = [{ Message: 'Export generated successfully', Timestamp: new Date().toISOString() }]
    }

    const csvContent = stringify(data, { header: true })
    // Excel UTF-8 BOM: \uFEFF
    const bomCsv = '\uFEFF' + csvContent

    return {
      content: bomCsv,
      filename,
    }
  },
}

export default reportsService
