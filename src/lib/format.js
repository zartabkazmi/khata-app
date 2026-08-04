const SYMBOLS = { USD: '$', EUR: '€', GBP: '£', PKR: '₨', INR: '₹', AED: 'د.إ', SAR: '﷼', CAD: '$', AUD: '$' }

export function formatMoney(amount, currency = 'USD') {
  const symbol = SYMBOLS[currency] || currency + ' '
  const n = Number(amount || 0)
  const formatted = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${n < 0 ? '-' : ''}${symbol}${formatted}`
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function monthKey(iso) {
  return (iso || '').slice(0, 7)
}
