// Local-first storage: every change is written to localStorage instantly
// (so the app always feels fast and works offline), then quietly synced to
// the user's Google Drive in the background if they're signed in.

import { loadFromDrive, saveToDrive } from './googleDrive'

const LOCAL_KEY = 'khata:data:v1'

export function emptyState() {
  return {
    version: 1,
    transactions: [],
    categories: defaultCategories(),
    budgets: {},
    settings: { currency: 'USD' },
  }
}

export function defaultCategories() {
  return [
    { id: 'food', label: 'Food & Dining', color: '#a6432f', icon: 'utensils' },
    { id: 'groceries', label: 'Groceries', color: '#2f5233', icon: 'shopping-basket' },
    { id: 'transport', label: 'Transport', color: '#b08d57', icon: 'car' },
    { id: 'bills', label: 'Bills & Utilities', color: '#6b7280', icon: 'receipt' },
    { id: 'shopping', label: 'Shopping', color: '#8a5fa8', icon: 'shopping-bag' },
    { id: 'health', label: 'Health', color: '#2f7a5f', icon: 'heart-pulse' },
    { id: 'entertainment', label: 'Entertainment', color: '#3a6ea5', icon: 'clapperboard' },
    { id: 'other', label: 'Other', color: '#9aa1ab', icon: 'more-horizontal' },
  ]
}

export function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : emptyState()
  } catch {
    return emptyState()
  }
}

export function saveLocal(state) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
  } catch {
    // storage full or unavailable — fail silently, Drive sync may still work
  }
}

let syncTimer = null

/** Debounced push to Drive — waits a beat so rapid edits don't spam the API. */
export function scheduleDriveSync(state, { onStatus } = {}) {
  clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try {
      onStatus?.('syncing')
      await saveToDrive(state)
      onStatus?.('synced')
    } catch (err) {
      onStatus?.('offline')
    }
  }, 900)
}

/** Merge: on first sign-in, prefer whichever data set has more transactions,
 *  then de-duplicate by id so nothing is silently lost either direction. */
export function mergeStates(local, remote) {
  if (!remote) return local
  if (!local) return remote

  const byId = new Map()
  ;[...remote.transactions, ...local.transactions].forEach((t) => byId.set(t.id, t))

  return {
    ...remote,
    transactions: Array.from(byId.values()).sort((a, b) => b.date.localeCompare(a.date)),
    categories: local.categories?.length ? local.categories : remote.categories,
    budgets: { ...remote.budgets, ...local.budgets },
    settings: { ...remote.settings, ...local.settings },
  }
}

export async function pullFromDrive() {
  return loadFromDrive()
}
