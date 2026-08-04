// Runs OCR entirely in the browser via Tesseract.js (WebAssembly). The image
// is read into memory, scanned for text, and then discarded — it is never
// uploaded anywhere or saved to disk/Drive. Only the extracted structured
// data (merchant, date, items, total) gets saved.

const MONEY = /(\d{1,3}(?:[,.\d]{0,})\d{0,2})\s*$/
const DATE_RE = /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/
const TOTAL_WORDS = /^(grand\s*)?total\b/i
const SUBTOTAL_WORDS = /sub\s*-?\s*total/i
const TAX_WORDS = /\b(tax|vat|gst|service\s*charge)\b/i
const SKIP_WORDS = /^(cash|change|card|visa|mastercard|thank you|welcome|table|order|invoice|receipt no|bill no|qty|item)/i

function toNumber(raw) {
  if (!raw) return null
  const cleaned = raw.replace(/[^\d.,]/g, '')
  // normalize "1,234.50" or "1.234,50" -> 1234.50
  const normalized = cleaned.includes(',') && cleaned.includes('.')
    ? cleaned.replace(/,/g, '')
    : cleaned.replace(',', '.')
  const num = parseFloat(normalized)
  return Number.isFinite(num) ? num : null
}

export async function scanReceipt(imageFile, onProgress) {
  // Loaded on demand, only when the user actually opens the scanner —
  // keeps the initial app load fast.
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress?.(Math.round(m.progress * 100))
    },
  })
  try {
    const { data } = await worker.recognize(imageFile)
    return parseReceiptText(data.text)
  } finally {
    await worker.terminate()
  }
}

export function parseReceiptText(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const result = {
    merchant: '',
    date: '',
    items: [],
    subtotal: null,
    tax: null,
    total: null,
    rawText: text,
  }

  // Merchant: first substantial line that isn't just numbers/symbols
  const merchantLine = lines.find((l) => /[a-zA-Z]{3,}/.test(l) && !DATE_RE.test(l))
  if (merchantLine) result.merchant = titleCase(merchantLine)

  // Date: first line matching a date pattern
  for (const l of lines) {
    const m = l.match(DATE_RE)
    if (m) {
      result.date = normalizeDate(m[1])
      break
    }
  }

  // Line items + totals
  for (const line of lines) {
    if (SKIP_WORDS.test(line)) continue
    const moneyMatch = line.match(MONEY)
    if (!moneyMatch) continue
    const amount = toNumber(moneyMatch[1])
    if (amount == null) continue

    if (TOTAL_WORDS.test(line)) {
      result.total = amount
      continue
    }
    if (SUBTOTAL_WORDS.test(line)) {
      result.subtotal = amount
      continue
    }
    if (TAX_WORDS.test(line)) {
      result.tax = amount
      continue
    }

    const description = line.slice(0, moneyMatch.index).replace(/[.\-–\s]+$/, '').trim()
    if (description.length >= 2 && amount > 0 && amount < 100000) {
      result.items.push({ name: titleCase(description), amount })
    }
  }

  if (result.total == null && result.items.length) {
    result.total = round2(result.items.reduce((s, i) => s + i.amount, 0) + (result.tax || 0))
  }

  return result
}

function round2(n) {
  return Math.round(n * 100) / 100
}

function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function normalizeDate(raw) {
  const parts = raw.split(/[\/\-.]/).map((p) => p.trim())
  if (parts.length !== 3) return raw
  let [a, b, c] = parts
  if (c.length === 2) c = (Number(c) > 50 ? '19' : '20') + c
  // Assume DD/MM/YYYY for anything ambiguous (most receipts worldwide use this)
  const day = a.padStart(2, '0')
  const month = b.padStart(2, '0')
  return `${c}-${month}-${day}`
}
