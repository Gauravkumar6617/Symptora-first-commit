import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { FormField } from '@/components/auth/FormField'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import { useAuthStore } from '@/store/authStore'

export function SignupPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name || !email || !phone || !password) {
      setError('All fields are required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    // TODO: replace with real API call once auth endpoints are ready
    login({
      id: 'mock-user',
      name,
      email,
      phone,
      avatarUrl: avatarUrl ?? undefined,
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
          value={avatarUrl}
          onChange={setAvatarUrl}
          label="Profile photo (optional)"
        />
        <FormField
          id="name"
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
            id="phone"
            label="Phone number"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
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
