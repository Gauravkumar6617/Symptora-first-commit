import { Download } from 'lucide-react'
import { useState } from 'react'
import { downloadPrescriptionPdf } from '@/lib/api'

export function PrescriptionPdfButton({ token, id }: { token: string | null; id: string }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  if (!token) return null
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        setFailed(false)
        try {
          await downloadPrescriptionPdf(token, id)
        } catch {
          setFailed(true)
        } finally {
          setBusy(false)
        }
      }}
      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-60"
    >
      <Download className="h-3.5 w-3.5" /> {busy ? 'Preparing…' : failed ? 'Retry PDF' : 'Download PDF'}
    </button>
  )
}
