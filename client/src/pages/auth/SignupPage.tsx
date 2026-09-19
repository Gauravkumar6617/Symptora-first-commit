import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { FormField } from '@/components/auth/FormField'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import { useAuthStore } from '@/store/authStore'

const genderOptions = ['male', 'female', 'other', 'unknown']

export interface SignupPayload {
  first_name: string
  last_name: string
  email: string
  number: string
  address: string
  avatar: string
  date_of_birth: string
  gender: string
  password: string
}

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

  function handleSubmit(event: FormEvent) {
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

    const payload: SignupPayload = {
      first_name: firstName,
      last_name: lastName,
      email,
      number,
      address,
      avatar: avatar ?? '',
      date_of_birth: new Date(dateOfBirth).toISOString(),
      gender,
      password,
    }

    // TODO: POST payload to the registration endpoint once auth wiring is ready
    void payload

    login({
      id: 'mock-user',
      name: `${firstName} ${lastName}`.trim(),
      email,
      phone: number,
      address,
      avatarUrl: avatar ?? undefined,
    })
    navigate('/dashboard')
  }

  return (
    <AuthSplitLayout
      title="Create your account"
      subtitle="Start your first health check in minutes"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
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
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Sign up
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
