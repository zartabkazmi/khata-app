import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { todayISO, uid } from '../lib/format'

export default function AddExpenseModal({ categories, initial, onSave, onClose }) {
  const [type, setType] = useState(initial?.type || 'expense')
  const [merchant, setMerchant] = useState(initial?.merchant || '')
  const [date, setDate] = useState(initial?.date || todayISO())
  const [category, setCategory] = useState(initial?.category || categories[0]?.id || 'other')
  const [items, setItems] = useState(initial?.items?.length ? initial.items : [])
  const [tax, setTax] = useState(initial?.tax ?? '')
  const [total, setTotal] = useState(initial?.total ?? initial?.amount ?? '')
  const [note, setNote] = useState(initial?.note || '')

  const itemsSum = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)

  function updateItem(idx, field, value) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))
  }
  function addItem() {
    setItems((prev) => [...prev, { name: '', amount: '' }])
  }
  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleSave() {
    const amount = Number(total || itemsSum || 0)
    if (!amount || amount <= 0) return
    onSave({
      id: initial?.id || uid(),
      type,
      merchant: merchant.trim() || 'Untitled',
      date,
      category,
      items: items.filter((i) => i.name && i.amount).map((i) => ({ name: i.name, amount: Number(i.amount) })),
      tax: tax ? Number(tax) : 0,
      amount,
      note: note.trim(),
    })
  }

  return (
    <div className="fixed inset-0 bg-ink/60 z-40 flex items-end md:items-center justify-center p-0 md:p-6 animate-fade-in">
      <div className="bg-paper w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-paper border-b border-line px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{initial?.fromScan ? 'Review scanned bill' : initial ? 'Edit' : 'Add expense'}</h2>
          <button onClick={onClose} className="text-slate hover:text-ink"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex rounded-full border border-line p-1 w-fit text-sm">
            {['expense', 'income'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-1.5 rounded-full capitalize transition-colors ${
                  type === t ? 'bg-ink text-paper' : 'text-slate'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <Field label="Merchant / Source">
            <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. Spice Garden Restaurant"
              className="input" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </Field>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-slate font-mono">Items (optional)</label>
              <button onClick={addItem} className="text-xs text-brass flex items-center gap-1 hover:underline">
                <Plus size={13} /> Add item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex gap-2">
                  <input value={it.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} placeholder="Biryani"
                    className="input flex-1" />
                  <input value={it.amount} onChange={(e) => updateItem(idx, 'amount', e.target.value)} placeholder="450"
                    type="number" className="input w-24 font-mono" />
                  <button onClick={() => removeItem(idx)} className="text-slate hover:text-rust"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tax / service">
              <input type="number" value={tax} onChange={(e) => setTax(e.target.value)} placeholder="0" className="input font-mono" />
            </Field>
            <Field label="Total amount">
              <input type="number" value={total} onChange={(e) => setTotal(e.target.value)}
                placeholder={itemsSum ? String(itemsSum) : '0.00'} className="input font-mono font-semibold" />
            </Field>
          </div>

          <Field label="Note (optional)">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything to remember this by" className="input" />
          </Field>
        </div>

        <div className="sticky bottom-0 bg-paper border-t border-line px-6 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-line text-sm text-ink-soft">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-full bg-ink text-paper text-sm hover:bg-ink-soft transition-colors">
            Save
          </button>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: white;
          border: 1px solid var(--color-line);
          border-radius: 0.75rem;
          padding: 0.55rem 0.85rem;
          font-size: 0.875rem;
          color: var(--color-ink);
        }
        .input:focus { outline: none; box-shadow: 0 0 0 2px rgba(176,141,87,0.4); }
      `}</style>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-slate font-mono mb-1.5">{label}</label>
      {children}
    </div>
  )
}
