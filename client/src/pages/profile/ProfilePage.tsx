import { CheckCircle2, Mail, MapPin, Phone, Stethoscope } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { FormField } from '@/components/auth/FormField'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import { useAuthStore } from '@/store/authStore'

export function ProfilePage() {
  const { user, updateProfile } = useAuthStore()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [address, setAddress] = useState(user?.address ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null)
  const [saved, setSaved] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    updateProfile({
      name,
      phone,
      address,
      avatarUrl: avatarUrl ?? undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="text-xl font-bold text-ink">You're not logged in</h1>
        <p className="mt-2 text-sm text-ink/60">
          Log in to view and edit your profile.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Your profile</h1>
      <p className="mt-2 text-sm text-ink/60">
        Keep your contact details up to date so doctors and clinics can
        reach you.
      </p>

      <form onSubmit={handleSubmit} className="card-raised mt-8 space-y-5 p-6 sm:p-8">
        <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} label="Profile photo" />

        {user.isDoctor && (
          <p className="flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-700">
            <Stethoscope className="h-4 w-4" />
            Doctor account
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="name"
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-ink">Email</label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm text-ink/50">
              <Mail className="h-4 w-4" />
              {user.email}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-ink">
              Phone number
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-ink/15 px-3 py-2 focus-within:border-primary">
              <Phone className="h-4 w-4 shrink-0 text-ink/40" />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
              />
            </div>
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-ink">
              Address
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-ink/15 px-3 py-2 focus-within:border-primary">
              <MapPin className="h-4 w-4 shrink-0 text-ink/40" />
              <input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city, state"
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-raised">
            Save changes
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
