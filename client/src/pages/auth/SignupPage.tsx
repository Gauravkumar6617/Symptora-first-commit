import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { FormField } from '@/components/auth/FormField'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import {
  ApiError,
  dataUrlToFile,
  requestRegistrationOtp,
  toAuthUser,
  verifyRegistrationOtp,
} from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const genderOptions = ['male', 'female', 'other', 'unknown']

export function SignupPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [number, setNumber] = useState('')
  const [address, setAddress] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [notice, setNotice] = useState('')

  async function handleDetailsSubmit(event: FormEvent) {
    event.preventDefault()
    if (
      !firstName ||
      !lastName ||
      !email ||
      !number ||
      !dateOfBirth ||
      !password
    ) {
      setError('Please fill in all required fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const { detail } = await requestRegistrationOtp({
        first_name: firstName,
        last_name: lastName,
        email,
        number,
        password,
        date_of_birth: new Date(dateOfBirth).toISOString(),
        address: address || undefined,
        gender: gender || undefined,
        avatar: avatar ? await dataUrlToFile(avatar) : null,
      })
      setNotice(detail)
      setOtpSent(true)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Something went wrong. Try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOtpSubmit(event: FormEvent) {
    event.preventDefault()
    if (otp.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const user = await verifyRegistrationOtp(email, otp)
      // No token here — POST /users/register/verify only creates the
      // account, it doesn't log it in. The dashboard still renders (it
      // tolerates a null token), but anything requiring a bearer token
      // will 401 until the user explicitly logs in.
      login(toAuthUser(user))
      navigate('/dashboard')
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Something went wrong. Try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (otpSent) {
    return (
      <AuthSplitLayout
        title="Verify your email"
        subtitle={`We sent a 6-digit code to ${email}`}
      >
        <form className="space-y-4" onSubmit={handleOtpSubmit}>
          <FormField
            id="otp"
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? 'Verifying…' : 'Verify and create account'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOtpSent(false)
              setOtp('')
              setError('')
            }}
            className="w-full text-center text-sm font-medium text-primary"
          >
            Edit your details
          </button>
        </form>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout
      title="Create your account"
      subtitle="Start your first health check in minutes"
    >
      <form className="space-y-4" onSubmit={handleDetailsSubmit}>
        <AvatarUpload
          value={avatar}
          onChange={setAvatar}
          label="Profile photo (optional)"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="first_name"
            label="First name"
            autoComplete="given-name"
            maxLength={24}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <FormField
            id="last_name"
            label="Last name"
            autoComplete="family-name"
            maxLength={24}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormField
            id="number"
            label="Phone number"
            type="tel"
            autoComplete="tel"
            maxLength={15}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>
        <FormField
          id="address"
          label="Address (optional)"
          autoComplete="street-address"
          maxLength={255}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="date_of_birth"
            label="Date of birth"
            type="date"
            autoComplete="bday"
            max={new Date().toISOString().slice(0, 10)}
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-ink"
            >
              Gender (optional)
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select</option>
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {notice && <p className="text-sm text-ink/60">{notice}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? 'Sending code…' : 'Sign up'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary">
          Log in
        </Link>
      </p>
    </AuthSplitLayout>
  )
}
