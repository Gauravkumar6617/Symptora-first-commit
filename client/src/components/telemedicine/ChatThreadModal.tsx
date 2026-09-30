import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { listMessages, sendMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface ChatThreadModalProps {
  kind: 'appointment' | 'telemedicine'
  id: string
  token: string
  currentUserId: string
  onClose: () => void
}

/** Chat follow-ups on one appointment or instant consultation — plain REST,
 * polled every few seconds; not latency-critical like the call signaling. */
export function ChatThreadModal({ kind, id, token, currentUserId, onClose }: ChatThreadModalProps) {
  const queryClient = useQueryClient()
  const queryKey = ['messages', kind, id]
  const { data: messages = [] } = useQuery({
    queryKey,
    queryFn: () => listMessages(token, kind, id),
    refetchInterval: 4000,
  })
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend() {
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    setBody('')
    try {
      await sendMessage(token, kind, id, text)
      await queryClient.invalidateQueries({ queryKey })
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        className="flex h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink/10 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
            <MessageCircle className="h-4 w-4 text-primary-600" /> Messages
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink/40 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="mt-6 text-center text-xs text-ink/40">No messages yet — say hello.</p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === currentUserId
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <p className="mb-0.5 text-[11px] font-semibold text-ink/40">{m.sender_name ?? 'Someone'}</p>
                <p
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? 'bg-primary text-white' : 'bg-surface text-ink'
                  }`}
                >
                  {m.body}
                </p>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 border-t border-ink/10 p-3">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend()
            }}
            placeholder="Type a message…"
            className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !body.trim()}
            className="rounded-lg bg-primary p-2.5 text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Opens the thread named in `?chat=<kind>:<id>` — where message
 * notifications link to — and clears the param on close. */
export function ChatFromLink() {
  const [params, setParams] = useSearchParams()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const [kind, id] = (params.get('chat') ?? '').split(':')
  if ((kind !== 'appointment' && kind !== 'telemedicine') || !id || !token || !user) return null
  return (
    <ChatThreadModal
      kind={kind}
      id={id}
      token={token}
      currentUserId={user.id}
      onClose={() => setParams((p) => { p.delete('chat'); return p }, { replace: true })}
    />
  )
}
