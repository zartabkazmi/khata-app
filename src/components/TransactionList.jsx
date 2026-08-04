import { useMemo, useState } from 'react'
import { Search, Trash2, Plus } from 'lucide-react'
import { formatMoney, formatDate } from '../lib/format'

export default function TransactionList({ transactions, categories, currency, onDelete, onAddNew }) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((t) => (categoryFilter === 'all' ? true : t.category === categoryFilter))
      .filter((t) => {
        if (!query) return true
        const q = query.toLowerCase()
        return (
          t.merchant?.toLowerCase().includes(q) ||
          t.note?.toLowerCase().includes(q) ||
          t.items?.some((i) => i.name?.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, query, categoryFilter])

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 py-8 animate-fade-in">
      <header className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="font-display text-3xl text-ink">Transactions</h1>
        <button
          onClick={onAddNew}
          className="flex items-center gap-1.5 text-sm bg-ink text-paper px-4 py-2.5 rounded-full hover:bg-ink-soft transition-colors shadow-sm"
        >
          <Plus size={16} /> Add manually
        </button>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search merchant, item, or note…"
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-full border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-line overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate italic py-14 text-center">No transactions match.</p>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((t) => {
              const cat = categories.find((c) => c.id === t.category)
              return (
                <li key={t.id} className="group px-5 py-3.5 flex items-center justify-between hover:bg-paper/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0"
                      style={{ background: `${cat?.color || '#9aa1ab'}22`, color: cat?.color || '#6b7280' }}
                    >
                      {(cat?.label || '?').slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-ink font-medium truncate">{t.merchant || cat?.label || 'Transaction'}</p>
                      <p className="text-xs text-slate">
                        {formatDate(t.date)} · {cat?.label || 'Uncategorized'}
                        {t.items?.length ? ` · ${t.items.length} item${t.items.length > 1 ? 's' : ''}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`font-mono text-sm ${t.type === 'income' ? 'text-forest' : 'text-ink'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount, currency)}
                    </span>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate hover:text-rust transition-opacity"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
