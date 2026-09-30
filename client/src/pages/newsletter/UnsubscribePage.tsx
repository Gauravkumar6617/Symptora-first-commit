import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { unsubscribeNewsletter } from '@/lib/api'

/** Where the unsubscribe link in newsletter emails lands: /newsletter/unsubscribe?token=… */
export function UnsubscribePage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [message, setMessage] = useState(token ? 'Unsubscribing…' : 'This unsubscribe link is incomplete.')

  useEffect(() => {
    if (!token) return
    unsubscribeNewsletter(token)
      .then(({ detail }) => setMessage(detail))
      .catch(() => setMessage('Something went wrong. Please try the link again in a moment.'))
  }, [token])

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-ink">Newsletter</h1>
      <p className="mt-3 text-sm text-ink/70">{message}</p>
      <Link to="/" className="btn-raised mt-8 inline-block">
        Back to home
      </Link>
    </div>
  )
}
