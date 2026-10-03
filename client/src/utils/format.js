/**
 * Standard formatters for The Champions Club
 */

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(dateStr)
  }
}

export const formatTime = (timeOrIso) => {
  if (!timeOrIso) return '-'
  if (typeof timeOrIso === 'string' && timeOrIso.length === 5 && timeOrIso.includes(':')) {
    return timeOrIso
  }
  try {
    const d = new Date(timeOrIso)
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return String(timeOrIso)
  }
}

export const formatDateTime = (iso) => {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return String(iso)
  }
}

export const getStatusBadgeColor = (status) => {
  const s = String(status).toLowerCase()
  switch (s) {
    case 'confirmed':
    case 'paid':
    case 'active':
    case 'completed':
    case 'won':
    case 'approved':
    case 'served':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'pending':
    case 'unpaid':
    case 'open':
    case 'preparing':
    case 'contacted':
    case 'sent':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'ready':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'new':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'cancelled':
    case 'void':
    case 'lost':
    case 'no_show':
    case 'rejected':
    case 'expired':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}
