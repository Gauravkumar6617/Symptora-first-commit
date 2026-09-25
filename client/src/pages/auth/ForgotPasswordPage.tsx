import { CheckCircle2, Mail } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { FormField } from '@/components/auth/FormField'
import {
  ApiError,
  requestPasswordReset,
  resetPassword,
  verifyPasswordReset,
} from '@/lib/api'

type Step = 'email' | 'otp' | 'reset' | 'done'

function messageFrom(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function sendCode() {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await requestPasswordReset(email.trim().toLowerCase())
      return true
    } catch (err) {
      setError(messageFrom(err, 'Could not send the code. Please try again.'))
      return false
    } finally {
      setBusy(false)
    }
  }

  async function handleSendOtp(event: FormEvent) {
    event.preventDefault()
    if (!email.includes('@')) {
      setError('Enter your email address.')
      return
    }
    if (await sendCode()) {
      setOtp('')
      setStep('otp')
    }
  }

  async function handleResend() {
    if (await sendCode()) setNotice('A new code is on its way.')
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault()
    if (otp.length !== 6) {
      setError('Enter the 6-digit code we emailed you.')
      return
    }
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const { reset_token } = await verifyPasswordReset(email.trim().toLowerCase(), otp)
      setResetToken(reset_token)
      setStep('reset')
    } catch (err) {
      setError(messageFrom(err, 'That code did not work. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleResetPassword(event: FormEvent) {
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
    setBusy(true)
    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        reset_token: resetToken,
        password,
      })
      setStep('done')
    } catch (err) {
      setError(messageFrom(err, 'Could not reset your password. Please try again.'))
    } finally {
      setBusy(false)
    }
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
            ? `If ${email} has an account, we sent it a 6-digit code`
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
            disabled={busy}
            className="btn-raised flex w-full items-center justify-center gap-2 disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            {busy ? 'Sending code…' : 'Send code'}
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
          {notice && <p className="text-sm text-success">{notice}</p>}
          <button type="submit" disabled={busy} className="btn-raised w-full disabled:opacity-60">
            {busy ? 'Checking…' : 'Verify code'}
          </button>
          <div className="flex justify-between text-sm font-medium text-primary">
            <button
              type="button"
              onClick={() => {
                setError('')
                setNotice('')
                setStep('email')
              }}
            >
              Use a different email
            </button>
            <button type="button" onClick={handleResend} disabled={busy} className="disabled:opacity-60">
              Resend code
            </button>
          </div>
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
          <button type="submit" disabled={busy} className="btn-raised w-full disabled:opacity-60">
            {busy ? 'Saving…' : 'Reset password'}
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
