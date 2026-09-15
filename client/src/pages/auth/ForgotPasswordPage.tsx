import { CheckCircle2, Mail } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { FormField } from '@/components/auth/FormField'

type Step = 'email' | 'otp' | 'reset' | 'done'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  function handleSendOtp(event: FormEvent) {
    event.preventDefault()
    if (!email) {
      setError('Enter your email address.')
      return
    }
    setError('')
    setSending(true)
    // TODO: replace with a real "send OTP to email" API call
    setTimeout(() => {
      setSending(false)
      setStep('otp')
    }, 700)
  }

  function handleVerifyOtp(event: FormEvent) {
    event.preventDefault()
    if (otp.length !== 6) {
      setError('Enter the 6-digit code we emailed you.')
      return
    }
    setError('')
    // TODO: verify OTP with the backend
    setStep('reset')
  }

  function handleResetPassword(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setError('')
    // TODO: submit new password to the backend
    setStep('done')
  }

  if (step === 'done') {
    return (
      <AuthSplitLayout title="Password reset" subtitle="You're all set">
        <div className="card-raised flex flex-col items-center p-8 text-center">
          <span className="icon-badge h-14 w-14">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-ink">
            Your password has been reset
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            You can now log in with your new password.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn-raised mt-6"
          >
            Back to login
          </button>
        </div>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout
      title={
        step === 'email'
          ? 'Forgot your password?'
          : step === 'otp'
            ? 'Check your email'
            : 'Set a new password'
      }
      subtitle={
        step === 'email'
          ? "Enter your email and we'll send you a one-time code"
          : step === 'otp'
            ? `We sent a 6-digit code to ${email}`
            : 'Choose a new password for your account'
      }
    >
      {step === 'email' && (
        <form className="space-y-4" onSubmit={handleSendOtp}>
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
            disabled={sending}
            className="btn-raised flex w-full items-center justify-center gap-2 disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            {sending ? 'Sending code…' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form className="space-y-4" onSubmit={handleVerifyOtp}>
          <FormField
            id="otp"
            label="6-digit code"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn-raised w-full">
            Verify code
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-center text-sm font-medium text-primary"
          >
            Use a different email
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form className="space-y-4" onSubmit={handleResetPassword}>
          <FormField
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormField
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn-raised w-full">
            Reset password
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink/60">
        Remembered your password?{' '}
        <Link to="/login" className="font-medium text-primary">
          Log in
        </Link>
      </p>
    </AuthSplitLayout>
  )
}
