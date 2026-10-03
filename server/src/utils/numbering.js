import { queryOne } from './db.js'

let counters = {
  member: 500,
  booking: 1000,
  payment: 5000,
  order: 200,
  tab: 50,
  invoice: 10,
}

export const nextNo = (prefix, length = 6) => {
  const year = new Date().getFullYear()
  const key = prefix.toLowerCase()
  counters[key] = (counters[key] || 0) + 1
  const padded = String(counters[key]).padStart(length, '0')
  return `${prefix}-${year}-${padded}`
}

export const nextMemberCode = async () => {
  try {
    const row = await queryOne('select public.next_member_code() as code')
    if (row && row.code) return row.code
  } catch {
    // fallback if DB sequence query fails
  }
  counters.member = (counters.member || 500) + 1
  return `CC-${String(counters.member).padStart(6, '0')}`
}

export const nextMemberCodeSync = () => {
  counters.member = (counters.member || 500) + 1
  return `CC-${String(counters.member).padStart(6, '0')}`
}

export const nextBookingNo = () => nextNo('BK', 6)
export const nextPaymentNo = () => nextNo('PAY', 6)
export const nextOrderNo = () => {
  const year = new Date().getFullYear()
  const rand = Math.floor(100000 + Math.random() * 900000)
  return `ORD-${year}-${rand}`
}
export const nextInvoiceNo = () => nextNo('INV', 4)

export const nextTabNo = () => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  counters.tab = (counters.tab || 10) + 1
  return `TAB-${today}-${String(counters.tab).padStart(4, '0')}`
}

export default {
  nextNo,
  nextMemberCode,
  nextBookingNo,
  nextPaymentNo,
  nextOrderNo,
  nextInvoiceNo,
  nextTabNo,
}
