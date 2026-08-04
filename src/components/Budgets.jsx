import { useMemo, useState } from 'react'
import { formatMoney, monthKey, todayISO } from '../lib/format'

export default function Budgets({ transactions, categories, budgets, currency, onSetBudget }) {
  const thisMonth = monthKey(todayISO())
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState('')

  const spentByCategory = useMemo(() => {
    const map = {}
    transactions
      .filter((t) => t.type !== 'income' && monthKey(t.date) === thisMonth)
      .forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount })
    return map
  }, [transactions, thisMonth])

  function startEdit(cat) {
    setEditingId(cat.id)
    setDraft(budgets[cat.id] ?? '')
  }
  function save(cat) {
    onSetBudget(cat.id, Number(draft) || 0)
    setEditingId(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-8 animate-fade-in">
      <h1 className="font-display text-3xl text-ink mb-2">Budgets</h1>
      <p className="text-sm text-slate mb-8">Set a monthly limit per category and keep an eye on it as you go.</p>

      <div className="space-y-3">
        {categories.map((c) => {
          const limit = budgets[c.id] || 0
          const spent = spentByCategory[c.id] || 0
          const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
          const over = limit > 0 && spent > limit

          return (
            <div key={c.id} className="bg-white rounded-2xl border border-line p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="text-sm font-medium text-ink">{c.label}</span>
                </div>
                {editingId === c.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="number"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && save(c)}
                      className="w-24 text-sm font-mono border border-line rounded-lg px-2 py-1"
                    />
                    <button onClick={() => save(c)} className="text-xs text-brass hover:underline">Save</button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(c)} className="text-xs text-slate hover:text-ink font-mono">
                    {limit > 0 ? `Limit ${formatMoney(limit, currency)}` : 'Set limit'}
                  </button>
                )}
              </div>

              {limit > 0 && (
                <>
                  <div className="h-2 rounded-full bg-paper-dim overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: over ? '#a6432f' : c.color }}
                    />
                  </div>
                  <p className={`text-xs mt-1.5 font-mono ${over ? 'text-rust' : 'text-slate'}`}>
                    {formatMoney(spent, currency)} of {formatMoney(limit, currency)} spent this month
                    {over ? ' — over budget' : ''}
                  </p>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
