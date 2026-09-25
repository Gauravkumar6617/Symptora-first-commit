import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { FormField } from '@/components/auth/FormField'
import { acceptFamilyInvite, ApiError, getCurrentUser, requestFamilyInvite, toAuthUser } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

/**
 * A family member someone added activates their own login: code from the
 * invite email + a new password. Their profile details come from the family
 * record, so there is nothing else to fill in.
 */
export function ActivateFamilyPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [number, setNumber] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleRequest(event?: FormEvent) {
    event?.preventDefault()
    if (!email.trim()) {
      setError('Enter the email your family member added you with.')
      return
    }
    setError('')
    setBusy(true)
    try {
      const { detail } = await requestFamilyInvite(email.trim())
      setNotice(detail)
      setStep('code')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleActivate(event: FormEvent) {
    event.preventDefault()
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from the email.')
      return
    }
    if (password.length < 8) {
      setError('Choose a password of at least 8 characters.')
      return
    }
    setError('')
    setBusy(true)
    try {
      const { access_token } = await acceptFamilyInvite({
        email: email.trim(),
        otp,
        password,
        number: number.replace(/[\s-]/g, '') || undefined,
      })
      const user = await getCurrentUser(access_token)
      login(toAuthUser(user), access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthSplitLayout
      title="Activate family account"
      subtitle="Someone added you as a family member? Set up your own login to see your health checks."
    >
      {step === 'email' ? (
        <form className="space-y-4" onSubmit={handleRequest}>
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Send me a code'}
          </button>
          <button
            type="button"
            onClick={() => {
              setError('')
              setStep('code')
            }}
            className="w-full text-center text-xs font-medium text-primary"
          >
            I already have a code
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleActivate}>
          {notice && <p className="rounded-lg bg-primary/5 p-3 text-xs text-ink/70">{notice}</p>}
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormField
            id="otp"
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <FormField
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormField
            id="number"
            label="Phone (only if your family member didn't add it)"
            type="tel"
            autoComplete="tel"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? 'Activating…' : 'Activate and log in'}
          </button>
          <button
            type="button"
            onClick={() => handleRequest()}
            disabled={busy || !email.trim()}
            className="w-full text-center text-xs font-medium text-primary disabled:opacity-50"
          >
            Send a new code
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink/60">
        Already activated?{' '}
        <Link to="/login" className="font-medium text-primary">
          Log in
        </Link>
      </p>
    </AuthSplitLayout>
  )
}
