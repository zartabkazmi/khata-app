import { useEffect, useRef, useState } from 'react'
import Login from './components/Login'
import Nav from './components/Nav'
import Dashboard from './components/Dashboard'
import TransactionList from './components/TransactionList'
import ScanReceipt from './components/ScanReceipt'
import Budgets from './components/Budgets'
import Settings from './components/Settings'
import AddExpenseModal from './components/AddExpenseModal'
import { loadLocal, saveLocal, scheduleDriveSync, mergeStates, pullFromDrive, emptyState } from './lib/storage'
import { signOut as googleSignOut } from './lib/googleAuth'
import { uid, todayISO } from './lib/format'

const PROFILE_KEY = 'khata:profile:v1'

export default function App() {
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') } catch { return null }
  })
  const [mode, setMode] = useState(profile ? 'app' : null) // null = show login, 'app' = signed in or local
  const [state, setState] = useState(loadLocal)
  const [tab, setTab] = useState('dashboard')
  const [syncStatus, setSyncStatus] = useState('idle')
  const [modal, setModal] = useState(null) // { initial } for add/edit/scan-review
  const hasSyncedOnce = useRef(false)

  // Persist locally on every change, always.
  useEffect(() => {
    saveLocal(state)
  }, [state])

  // On sign-in, pull Drive data once and merge with local.
  useEffect(() => {
    if (!profile || hasSyncedOnce.current) return
    hasSyncedOnce.current = true
    ;(async () => {
      try {
        setSyncStatus('syncing')
        const remote = await pullFromDrive()
        setState((local) => mergeStates(local, remote))
        setSyncStatus('synced')
      } catch {
        setSyncStatus('offline')
      }
    })()
  }, [profile])

  // Push to Drive (debounced) whenever state changes, if signed in.
  useEffect(() => {
    if (!profile) return
    scheduleDriveSync(state, { onStatus: setSyncStatus })
  }, [state, profile])

  function handleSignedIn(p) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
    setProfile(p)
    setMode('app')
  }

  function handleContinueLocal() {
    setMode('app')
  }

  function handleSignOut() {
    googleSignOut()
    localStorage.removeItem(PROFILE_KEY)
    setProfile(null)
    setMode(null)
    hasSyncedOnce.current = false
  }

  function upsertTransaction(tx) {
    setState((s) => {
      const exists = s.transactions.some((t) => t.id === tx.id)
      const transactions = exists
        ? s.transactions.map((t) => (t.id === tx.id ? tx : t))
        : [tx, ...s.transactions]
      return { ...s, transactions }
    })
    setModal(null)
  }

  function deleteTransaction(id) {
    setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }))
  }

  function setBudget(categoryId, amount) {
    setState((s) => ({ ...s, budgets: { ...s.budgets, [categoryId]: amount } }))
  }

  function handleScanned(parsed) {
    setModal({
      fromScan: true,
      initial: {
        id: uid(),
        type: 'expense',
        merchant: parsed.merchant,
        date: parsed.date || todayISO(),
        category: guessCategory(parsed.merchant, state.categories),
        items: parsed.items,
        tax: parsed.tax || 0,
        total: parsed.total ?? parsed.subtotal ?? undefined,
        amount: parsed.total ?? parsed.subtotal ?? 0,
        note: '',
        fromScan: true,
      },
    })
    setTab('transactions')
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `khata-backup-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(file) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        setState((s) => mergeStates(s, parsed))
      } catch {
        alert('That file could not be read as a Khata backup.')
      }
    }
    reader.readAsText(file)
  }

  if (mode !== 'app') {
    return <Login onSignedIn={handleSignedIn} onContinueLocal={handleContinueLocal} />
  }

  return (
    <div className="min-h-screen bg-paper flex">
      <Nav active={tab} onChange={setTab} profile={profile} onSignOut={handleSignOut} syncStatus={syncStatus} />

      <main className="flex-1 pb-20 md:pb-0">
        {tab === 'dashboard' && (
          <Dashboard
            transactions={state.transactions}
            categories={state.categories}
            currency={state.settings.currency}
            onGoToScan={() => setTab('scan')}
          />
        )}
        {tab === 'transactions' && (
          <TransactionList
            transactions={state.transactions}
            categories={state.categories}
            currency={state.settings.currency}
            onDelete={deleteTransaction}
            onAddNew={() => setModal({ initial: null })}
          />
        )}
        {tab === 'scan' && <ScanReceipt onScanned={handleScanned} />}
        {tab === 'budgets' && (
          <Budgets
            transactions={state.transactions}
            categories={state.categories}
            budgets={state.budgets}
            currency={state.settings.currency}
            onSetBudget={setBudget}
          />
        )}
        {tab === 'settings' && (
          <Settings state={state} setState={setState} profile={profile} onExport={handleExport} onImport={handleImport} />
        )}
      </main>

      {modal !== undefined && modal !== null && (
        <AddExpenseModal
          categories={state.categories}
          initial={modal.initial}
          onSave={upsertTransaction}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function guessCategory(merchantName, categories) {
  const name = (merchantName || '').toLowerCase()
  const rules = [
    { test: /restaurant|cafe|kitchen|biryani|pizza|food|diner/, id: 'food' },
    { test: /mart|grocer|super\s?market|store/, id: 'groceries' },
    { test: /fuel|petrol|gas station|uber|taxi|transport/, id: 'transport' },
    { test: /electric|water|internet|utility|bill/, id: 'bills' },
    { test: /pharmacy|clinic|hospital|medical/, id: 'health' },
    { test: /cinema|movie|netflix|entertainment/, id: 'entertainment' },
  ]
  const match = rules.find((r) => r.test.test(name))
  return match && categories.some((c) => c.id === match.id) ? match.id : 'other'
}
