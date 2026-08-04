import { useRef, useState } from 'react'
import { Camera, Image as ImageIcon, ShieldCheck, Loader2 } from 'lucide-react'
import { scanReceipt } from '../lib/ocr'

export default function ScanReceipt({ onScanned }) {
  const cameraInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)

  async function handleFile(file) {
    if (!file) return
    setError('')
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setProgress(0)
    try {
      const parsed = await scanReceipt(file, setProgress)
      onScanned(parsed)
    } catch (err) {
      setError('Could not read that image clearly — try a well-lit, flat photo, or enter it manually instead.')
    } finally {
      setProgress(null)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-5 md:px-8 py-8 animate-fade-in">
      <h1 className="font-display text-3xl text-ink mb-2">Scan a bill</h1>
      <p className="text-sm text-slate mb-8 leading-relaxed">
        Point the camera at a receipt. Text is read entirely on your device — the photo itself
        is never saved or uploaded anywhere, only the numbers and items are kept.
      </p>

      <div className="bg-white rounded-2xl border border-line p-8 text-center">
        {progress !== null ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-brass" size={28} />
            <p className="text-sm text-ink-soft font-mono">Reading receipt… {progress}%</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-paper-dim mx-auto flex items-center justify-center mb-5">
              <Camera size={26} className="text-brass" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="px-5 py-2.5 rounded-full bg-ink text-paper text-sm hover:bg-ink-soft transition-colors flex items-center gap-2 justify-center"
              >
                <Camera size={16} /> Open camera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-full border border-line text-sm text-ink-soft hover:bg-paper-dim transition-colors flex items-center gap-2 justify-center"
              >
                <ImageIcon size={16} /> Choose photo
              </button>
            </div>
            {error && <p className="text-xs text-rust mt-4">{error}</p>}
          </>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div className="mt-5 flex items-start gap-2.5 text-xs text-slate">
        <ShieldCheck size={16} className="shrink-0 mt-0.5 text-forest" />
        <p>
          Nothing here ever touches a server we run — recognition happens locally in your browser,
          and only the structured result (merchant, items, total) is written to your Drive file.
        </p>
      </div>
    </div>
  )
}
