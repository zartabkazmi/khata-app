import { useRef } from 'react'
import { Download, Upload, ShieldCheck } from 'lucide-react'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD']
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''

export default function Settings({ state, setState, profile, onExport, onImport }) {
  const fileRef = useRef(null)
  const isAdmin = profile && ADMIN_EMAIL && profile.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

  return (
    <div className="max-w-xl mx-auto px-5 md:px-8 py-8 animate-fade-in space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink mb-2">Settings</h1>
        <p className="text-sm text-slate">Your preferences and data controls.</p>
      </div>

      <section className="bg-white rounded-2xl border border-line p-6">
        <h2 className="font-display text-lg text-ink mb-4">Currency</h2>
        <select
          value={state.settings.currency}
          onChange={(e) => setState((s) => ({ ...s, settings: { ...s.settings, currency: e.target.value } }))}
          className="border border-line rounded-xl px-4 py-2.5 text-sm bg-paper"
        >
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </section>

      <section className="bg-white rounded-2xl border border-line p-6">
        <h2 className="font-display text-lg text-ink mb-2">Your data</h2>
        <p className="text-xs text-slate mb-4 leading-relaxed">
          {profile
            ? 'Synced automatically to a private file in your own Google Drive. You can also keep a manual backup below.'
            : 'Currently saved only in this browser. Sign in to back it up to your Google Drive automatically.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={onExport} className="flex items-center gap-2 text-sm border border-line rounded-full px-4 py-2 hover:bg-paper-dim">
            <Download size={15} /> Export backup (.json)
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-sm border border-line rounded-full px-4 py-2 hover:bg-paper-dim">
            <Upload size={15} /> Import backup
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
        </div>
      </section>

      {isAdmin && (
        <section className="bg-ink text-paper rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={17} className="text-brass-light" />
            <h2 className="font-display text-lg">Admin mode</h2>
          </div>
          <p className="text-xs text-slate-light mb-5 leading-relaxed">
            Visible only to {ADMIN_EMAIL}. Because Tally has no server, this reflects your own
            account's data only — there's no central database of other users to inspect, by design.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <AdminStat label="Transactions" value={state.transactions.length} />
            <AdminStat label="Categories" value={state.categories.length} />
            <AdminStat label="Budgets set" value={Object.keys(state.budgets).length} />
          </div>
        </section>
      )}
    </div>
  )
}

function AdminStat({ label, value }) {
  return (
    <div className="bg-white/5 rounded-xl py-4">
      <p className="font-display text-2xl text-brass-light">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-light mt-1">{label}</p>
    </div>
  )
}
