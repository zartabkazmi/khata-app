import { LayoutGrid, Receipt, ScanLine, Target, Settings, LogOut } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'scan', label: 'Scan', icon: ScanLine },
  { id: 'budgets', label: 'Budgets', icon: Target },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Nav({ active, onChange, profile, onSignOut, syncStatus }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-ink text-paper h-screen sticky top-0">
        <div className="px-6 py-6 flex items-center gap-2">
          <TallyMark />
          <span className="font-display text-xl">Khata</span>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active === t.id
                  ? 'bg-brass/20 text-brass-light font-medium'
                  : 'text-slate-light hover:bg-white/5 hover:text-paper'
              }`}
            >
              <t.icon size={18} strokeWidth={1.75} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-5 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 px-3 mb-3">
            <span className={`w-1.5 h-1.5 rounded-full ${
              syncStatus === 'synced' ? 'bg-forest' : syncStatus === 'syncing' ? 'bg-brass animate-pulse' : 'bg-slate-light'
            }`} />
            <span className="text-[11px] text-slate-light font-mono">
              {syncStatus === 'synced' ? 'Synced to Drive' : syncStatus === 'syncing' ? 'Syncing…' : profile ? 'Offline' : 'Local only'}
            </span>
          </div>
          {profile && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
              {profile.picture ? (
                <img src={profile.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brass/30" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{profile.name}</p>
              </div>
              <button onClick={onSignOut} title="Sign out" className="text-slate-light hover:text-paper">
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-ink text-paper flex justify-around py-2 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] ${
              active === t.id ? 'text-brass-light' : 'text-slate-light'
            }`}
          >
            <t.icon size={19} strokeWidth={1.75} />
            {t.label}
          </button>
        ))}
      </nav>
    </>
  )
}

function TallyMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="14" fill="#b08d57" />
      <path d="M18 22 h28 M18 32 h28 M18 42 h18" stroke="#14171f" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
