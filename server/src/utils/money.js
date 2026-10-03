/**
 * Financial and monetary calculations complying with BR-13 and BR-16.
 */

export const round2 = (num) => {
  const val = Number(num)
  if (!Number.isFinite(val)) return 0
  return Math.round(val * 100) / 100
}

/**
 * BR-16: Listed prices are tax-inclusive.
 * Tax = gross * rate / (100 + rate)
 */
export const calcInclusiveTax = (gross, taxRatePct = 18) => {
  const g = Number(gross) || 0
  const r = Number(taxRatePct) || 0
  if (r <= 0 || g <= 0) return 0
  return round2((g * r) / (100 + r))
}

/**
 * Tax-exclusive calculation (e.g. for invoices, BR-18).
 * Tax = net * rate / 100
 */
export const calcExclusiveTax = (net, taxRatePct = 18) => {
  const n = Number(net) || 0
  const r = Number(taxRatePct) || 0
  if (r <= 0 || n <= 0) return 0
  return round2((n * r) / 100)
}

export default {
  round2,
  calcInclusiveTax,
  calcExclusiveTax,
}
