import { Loader2, PhoneOff, Stethoscope } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ApiError,
  cancelConsultation,
  getTelemedicineConsultation,
  telemedicinePatientSocketUrl,
} from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

/** Shown right after a patient starts an instant consultation: waits for a
 * doctor to accept (pushed over a socket), then hands off to the call room. */
export function TelemedicineWaitingPage() {
  const { id = '' } = useParams()
  const token = useAuthStore((state) => state.token)
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'waiting' | 'cancelled' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    getTelemedicineConsultation(token, id)
      .then((consultation) => {
        if (cancelled) return
        if (consultation.status === 'in_progress') {
          navigate(`/call/telemedicine/${id}`, { replace: true })
          return
        }
        if (consultation.status !== 'pending') {
          setStatus('cancelled')
          return
        }
        setStatus('waiting')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Could not load this consultation.')
        setStatus('error')
      })

    const ws = new WebSocket(telemedicinePatientSocketUrl(id, token))
    wsRef.current = ws
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'accepted') navigate(`/call/telemedicine/${id}`, { replace: true })
      if (message.type === 'cancelled') setStatus('cancelled')
    }

    return () => {
      cancelled = true
      ws.close()
    }
  }, [id, navigate, token])

  async function handleCancel() {
    if (!token) return
    setCancelling(true)
    try {
      await cancelConsultation(token, id)
      navigate('/telemedicine')
    } catch {
      setCancelling(false)
    }
  }

  if (!token) return null

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4">
      <div className="card-raised w-full max-w-sm p-8 text-center">
        <span className="icon-badge mx-auto h-14 w-14">
          {status === 'waiting' || status === 'loading' ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          ) : (
            <Stethoscope className="h-6 w-6 text-primary-600" />
          )}
        </span>

        {status === 'loading' && <p className="mt-4 text-sm text-ink/60">Loading…</p>}

        {status === 'waiting' && (
          <>
            <h1 className="mt-4 text-lg font-bold text-ink">Connecting you to a doctor</h1>
            <p className="mt-2 text-sm text-ink/60">
              We've notified every available doctor. This usually takes under a minute.
            </p>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-danger/20 px-5 py-3 text-sm font-semibold text-danger hover:bg-danger/5 disabled:opacity-60"
            >
              <PhoneOff className="h-4 w-4" /> {cancelling ? 'Cancelling…' : 'Cancel request'}
            </button>
          </>
        )}

        {status === 'cancelled' && (
          <>
            <h1 className="mt-4 text-lg font-bold text-ink">This request is no longer active</h1>
            <button type="button" onClick={() => navigate('/telemedicine')} className="btn-raised mt-6 w-full">
              Back to telemedicine
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="mt-4 text-sm text-danger">{error}</p>
            <button type="button" onClick={() => navigate('/telemedicine')} className="btn-raised mt-6 w-full">
              Back to telemedicine
            </button>
          </>
        )}
      </div>
    </div>
  )
}
