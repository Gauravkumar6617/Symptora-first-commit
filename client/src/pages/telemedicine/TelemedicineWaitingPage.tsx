import { CreditCard, Loader2, PhoneOff, Stethoscope } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ApiError,
  cancelConsultation,
  confirmConsultationPayment,
  createConsultationPayment,
  getTelemedicineConsultation,
  telemedicinePatientSocketUrl,
  type TelemedicineConsultation,
} from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the payment page.'))
    document.body.appendChild(script)
  })
}

/** Pay the consultation fee: Razorpay checkout (test mode), or a one-click
 * simulated payment when the server has no Razorpay keys. */
async function payForConsultation(token: string, id: string): Promise<TelemedicineConsultation> {
  const order = await createConsultationPayment(token, id)
  if (order.gateway === 'simulated') {
    return confirmConsultationPayment(token, id, { order_id: order.order_id, payment_id: `test_${Date.now()}` })
  }
  await loadRazorpay()
  const paid = await new Promise<RazorpayResponse>((resolve, reject) => {
    new window.Razorpay!({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount * 100,
      currency: order.currency,
      name: 'Symptora',
      description: 'Instant video consultation',
      handler: resolve,
      modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
    }).open()
  })
  return confirmConsultationPayment(token, id, {
    order_id: paid.razorpay_order_id,
    payment_id: paid.razorpay_payment_id,
    signature: paid.razorpay_signature,
  })
}

/** Shown right after a patient starts an instant consultation: takes the
 * payment, then waits for a doctor to accept (pushed over a socket) and
 * hands off to the call room. */
export function TelemedicineWaitingPage() {
  const { id = '' } = useParams()
  const token = useAuthStore((state) => state.token)
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'payment' | 'waiting' | 'cancelled' | 'error'>('loading')
  const [amount, setAmount] = useState<number | null>(null)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    // Server state decides the screen every time — unpaid always means the
    // Pay step, never "waiting" (an unpaid request isn't in any doctor's queue).
    function apply(consultation: TelemedicineConsultation) {
      if (cancelled) return
      if (consultation.status === 'in_progress') navigate(`/call/telemedicine/${id}`, { replace: true })
      else if (consultation.status !== 'pending') setStatus('cancelled')
      else {
        setAmount(consultation.amount)
        setStatus(consultation.paid_at ? 'waiting' : 'payment')
      }
    }

    getTelemedicineConsultation(token, id)
      .then(apply)
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

    // Fallback in case the push is ever missed (dropped socket, etc.) — the
    // socket is still the fast path, this just guarantees we don't get stuck.
    const poll = setInterval(() => {
      getTelemedicineConsultation(token, id).then(apply).catch(() => {})
    }, 4000)

    return () => {
      cancelled = true
      clearInterval(poll)
      ws.close()
    }
  }, [id, navigate, token])

  async function handlePay() {
    if (!token) return
    setPaying(true)
    setError(null)
    try {
      await payForConsultation(token, id)
      setStatus('waiting')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

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
          {status === 'payment' ? (
            <CreditCard className="h-6 w-6 text-primary-600" />
          ) : status === 'waiting' || status === 'loading' ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          ) : (
            <Stethoscope className="h-6 w-6 text-primary-600" />
          )}
        </span>

        {status === 'loading' && <p className="mt-4 text-sm text-ink/60">Loading…</p>}

        {status === 'payment' && (
          <>
            <h1 className="mt-4 text-lg font-bold text-ink">Pay to connect with a doctor</h1>
            <p className="mt-2 text-sm text-ink/60">
              Consultation fee <span className="font-semibold text-ink">₹{amount ?? '—'}</span>. Doctors are
              notified the moment payment goes through.
            </p>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="btn-raised mt-6 inline-flex w-full items-center justify-center gap-2 disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" /> {paying ? 'Processing…' : `Pay ₹${amount ?? ''}`}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling || paying}
              className="mt-3 text-sm font-semibold text-ink/50 hover:text-danger disabled:opacity-60"
            >
              {cancelling ? 'Cancelling…' : 'Cancel request'}
            </button>
          </>
        )}

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
