import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatMoney, monthKey, todayISO } from '../lib/format'

export default function Dashboard({ transactions, categories, currency, onGoToScan }) {
  const now = todayISO()
  const thisMonth = monthKey(now)

  const monthTx = useMemo(
    () => transactions.filter((t) => monthKey(t.date) === thisMonth),
    [transactions, thisMonth]
  )

  const totalSpent = monthTx.filter((t) => t.type !== 'income').reduce((s, t) => s + t.amount, 0)
  const totalIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const net = totalIncome - totalSpent

  const byCategory = useMemo(() => {
    const map = {}
    monthTx.filter((t) => t.type !== 'income').forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount
    })
    return Object.entries(map)
      .map(([id, value]) => {
        const cat = categories.find((c) => c.id === id) || { label: id, color: '#9aa1ab' }
        return { id, name: cat.label, value, color: cat.color }
      })
      .sort((a, b) => b.value - a.value)
  }, [monthTx, categories])

  const trend = useMemo(() => {
    const map = {}
    transactions.forEach((t) => {
      const k = monthKey(t.date)
      if (!k) return
      map[k] = map[k] || { month: k, spent: 0, income: 0 }
      if (t.type === 'income') map[k].income += t.amount
      else map[k].spent += t.amount
    })
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)
  }, [transactions])

  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-8 space-y-8 animate-fade-in">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate font-mono">This month</p>
          <h1 className="font-display text-3xl text-ink mt-1">Your balance sheet</h1>
        </div>
        <button
          onClick={onGoToScan}
          className="text-sm bg-ink text-paper px-4 py-2.5 rounded-full hover:bg-ink-soft transition-colors shadow-sm"
        >
          + Scan a bill
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Spent" value={formatMoney(totalSpent, currency)} tone="rust" />
        <StatCard label="Income" value={formatMoney(totalIncome, currency)} tone="forest" />
        <StatCard label="Net" value={formatMoney(net, currency)} tone={net >= 0 ? 'forest' : 'rust'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-2 bg-white rounded-2xl border border-line p-6">
          <h2 className="font-display text-lg text-ink mb-4">By category</h2>
          {byCategory.length === 0 ? (
            <EmptyNote text="Nothing logged this month yet." />
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                      {byCategory.map((c) => (
                        <Cell key={c.id} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1.5">
                {byCategory.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink-soft">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className="font-mono text-ink">{formatMoney(c.value, currency)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="lg:col-span-3 bg-white rounded-2xl border border-line p-6">
          <h2 className="font-display text-lg text-ink mb-4">6-month trend</h2>
          {trend.length === 0 ? (
            <EmptyNote text="Add a few expenses to see your trend." />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid stroke="#ded8c9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(v) => formatMoney(v, currency)} />
                  <Line type="monotone" dataKey="spent" stroke="#a6432f" strokeWidth={2} dot={false} name="Spent" />
                  <Line type="monotone" dataKey="income" stroke="#2f5233" strokeWidth={2} dot={false} name="Income" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-line p-6">
        <h2 className="font-display text-lg text-ink mb-4">Recent activity</h2>
        {recent.length === 0 ? (
          <EmptyNote text="No transactions yet. Scan a bill or add one manually to get started." />
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((t) => {
              const cat = categories.find((c) => c.id === t.category)
              return (
                <li key={t.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat?.color || '#9aa1ab' }} />
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{t.merchant || cat?.label || 'Transaction'}</p>
                      <p className="text-xs text-slate">{t.date}</p>
                    </div>
                  </div>
                  <span className={`font-mono text-sm shrink-0 ${t.type === 'income' ? 'text-forest' : 'text-ink'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount, currency)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, tone }) {
  const toneClass = tone === 'forest' ? 'text-forest' : tone === 'rust' ? 'text-rust' : 'text-ink'
  return (
    <div className="bg-white rounded-2xl border border-line p-5">
      <p className="text-xs uppercase tracking-[0.15em] text-slate font-mono">{label}</p>
      <p className={`font-display text-2xl mt-2 ${toneClass}`}>{value}</p>
    </div>
  )
}

function EmptyNote({ text }) {
  return <p className="text-sm text-slate italic py-8 text-center">{text}</p>
}
