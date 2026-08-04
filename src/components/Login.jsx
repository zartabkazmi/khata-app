import { useEffect, useRef, useState } from 'react'
import { renderSignInButton, isConfigured } from '../lib/googleAuth'

export default function Login({ onSignedIn, onContinueLocal }) {
  const btnRef = useRef(null)
  const [configured] = useState(isConfigured())

  useEffect(() => {
    if (!configured) return
    const tryRender = () => {
      if (window.google && btnRef.current) {
        renderSignInButton(btnRef.current, onSignedIn)
      } else {
        setTimeout(tryRender, 200)
      }
    }
    tryRender()
  }, [configured, onSignedIn])

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-tally-in">
        <div className="bg-paper rounded-t-2xl px-8 pt-10 pb-8 shadow-2xl relative">
          <div className="flex items-center gap-2 justify-center mb-1">
            <TallyMark />
            <span className="font-display text-2xl tracking-tight text-ink">Khata</span>
          </div>
          <p className="text-center text-slate text-sm font-mono mt-1">every rupee, accounted for</p>

          <div className="mt-8 border-t border-dashed border-line pt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate text-center mb-1">Sign in</p>
            <p className="text-center text-ink-soft text-sm mb-6 leading-relaxed">
              Your data is saved only in <span className="font-medium">your own</span> Google Drive.
              We never see it, store it, or sell it.
            </p>

            {configured ? (
              <div className="flex justify-center" ref={btnRef} />
            ) : (
              <div className="text-center text-xs text-rust bg-rust-light rounded-lg px-4 py-3 leading-relaxed">
                Google Sign-In isn't configured yet. Add a Client ID in <code className="font-mono">.env</code> — see README.md.
              </div>
            )}

            <button
              onClick={onContinueLocal}
              className="w-full mt-4 text-center text-xs text-slate hover:text-ink underline decoration-dotted underline-offset-4 transition-colors"
            >
              Continue without signing in (saved on this device only)
            </button>
          </div>
        </div>
        <div className="perf-edge bg-ink rounded-b-2xl" />
      </div>
    </div>
  )
}

function TallyMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="14" fill="#14171f" />
      <path d="M18 22 h28 M18 32 h28 M18 42 h18" stroke="#b08d57" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
