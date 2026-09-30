import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listNotifications, readAllNotifications } from '@/lib/api'

/** Bell + dropdown: "Dr. X joined the call", new messages, prescriptions,
 * payments. Polled — a few seconds' delay is fine for these. */
export function NotificationBell({ token, className = '' }: { token: string; className?: string }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications(token),
    refetchInterval: 10000,
  })
  const unread = notifications.filter((n) => !n.read).length

  async function toggle() {
    const opening = !open
    setOpen(opening)
    if (opening && unread) {
      await readAllNotifications(token)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  }

  return (
    <div className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative rounded-lg border border-ink/15 p-2 hover:bg-ink/5"
      >
        <Bell className="h-5 w-5 text-ink" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-ink/10 bg-white shadow-xl">
          {notifications.length === 0 ? (
            <p className="p-5 text-center text-sm text-ink/50">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {notifications.map((n) => {
                const content = (
                  <>
                    <p className={`text-sm ${n.read ? 'text-ink/70' : 'font-semibold text-ink'}`}>{n.title}</p>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-ink/50">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-ink/40">{new Date(n.created_at).toLocaleString()}</p>
                  </>
                )
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link to={n.link} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-surface">
                        {content}
                      </Link>
                    ) : (
                      <div className="px-4 py-3">{content}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
