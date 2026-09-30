import { CheckCircle2, Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { callSocketUrl } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// STUN finds a direct path; phones on mobile data (carrier NAT) usually also
// need a TURN relay. Set VITE_TURN_URL / VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL
// (e.g. a free metered.ca or self-hosted coturn server) to enable it.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ...(import.meta.env.VITE_TURN_URL
    ? [{
        urls: String(import.meta.env.VITE_TURN_URL).split(','),
        username: import.meta.env.VITE_TURN_USERNAME,
        credential: import.meta.env.VITE_TURN_CREDENTIAL,
      }]
    : []),
]

type CallState = 'connecting' | 'waiting' | 'in-call' | 'ended'

export function CallPage() {
  const { kind, id = '' } = useParams<{ kind: 'appointment' | 'telemedicine'; id: string }>()
  const appointmentId = id
  const token = useAuthStore((state) => state.token)
  const isDoctor = useAuthStore((state) => Boolean(state.user?.isDoctor))

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const [state, setState] = useState<CallState>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  /** The browser blocked auto-play (common in phone in-app browsers). */
  const [needsTap, setNeedsTap] = useState(false)
  /** Why the call is over: this side hung up, or the consultation was completed. */
  const [endReason, setEndReason] = useState<'left' | 'completed'>('left')
  /** The other participant hung up while this side is still here. */
  const [peerLeft, setPeerLeft] = useState(false)

  function teardown() {
    wsRef.current?.close()
    pcRef.current?.close()
    for (const track of localStreamRef.current?.getTracks() ?? []) track.stop()
  }

  useEffect(() => {
    if (!token) return
    let cancelled = false

    function send(message: Record<string, unknown>) {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(message))
    }

    // ICE candidates can arrive before the offer/answer is applied (the
    // handlers are async); adding them then fails, so hold them until it is.
    let pendingCandidates: RTCIceCandidateInit[] = []
    async function flushCandidates(pc: RTCPeerConnection) {
      for (const candidate of pendingCandidates) await pc.addIceCandidate(candidate).catch(() => {})
      pendingCandidates = []
    }

    function resetPeerConnection() {
      pcRef.current?.close()
      pcRef.current = null
      pendingCandidates = []
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    }

    function ensurePeerConnection() {
      if (pcRef.current) return pcRef.current
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      pc.onicecandidate = (e) => {
        if (e.candidate) send({ type: 'ice-candidate', candidate: e.candidate })
      }
      pc.ontrack = (e) => {
        const video = remoteVideoRef.current
        if (video && video.srcObject !== e.streams[0]) {
          video.srcObject = e.streams[0]
          video.play().catch(() => setNeedsTap(true))
        }
        setState('in-call')
      }
      for (const track of localStreamRef.current?.getTracks() ?? []) {
        pc.addTrack(track, localStreamRef.current!)
      }
      pcRef.current = pc
      return pc
    }

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop()
          return
        }
        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
      } catch {
        setError('Could not access your camera/microphone. Check your browser permissions.')
        return
      }

      const ws = new WebSocket(callSocketUrl(kind === 'telemedicine' ? 'telemedicine' : 'appointment', appointmentId, token!))
      wsRef.current = ws

      ws.onopen = () => setState('waiting')
      ws.onerror = () => setError('Could not connect to the call. Please try again.')
      ws.onclose = (e) => {
        if (e.code === 4410) {
          // Completed (e.g. prescription issued) — at join time or mid-call.
          teardown()
          setEndReason('completed')
          setState('ended')
        } else if (e.code === 4403) setError('You are not allowed to join this call.')
        else if (e.code === 4409) setError('This call already has both participants.')
      }

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data)
        const pc = ensurePeerConnection()
        switch (message.type) {
          case 'peer-joined': {
            // The other side (re)joined: always start from a fresh connection,
            // never renegotiate a dead one from their previous attempt.
            resetPeerConnection()
            setPeerLeft(false)
            const fresh = ensurePeerConnection()
            const offer = await fresh.createOffer()
            await fresh.setLocalDescription(offer)
            send({ type: 'offer', sdp: offer })
            break
          }
          case 'offer': {
            await pc.setRemoteDescription(new RTCSessionDescription(message.sdp))
            await flushCandidates(pc)
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            send({ type: 'answer', sdp: answer })
            break
          }
          case 'answer':
            await pc.setRemoteDescription(new RTCSessionDescription(message.sdp))
            await flushCandidates(pc)
            break
          case 'ice-candidate':
            if (pc.remoteDescription) await pc.addIceCandidate(message.candidate).catch(() => {})
            else pendingCandidates.push(message.candidate)
            break
          case 'peer-left':
            resetPeerConnection()
            setPeerLeft(true)
            setState('waiting')
            break
          case 'call-ended':
            teardown()
            setEndReason('completed')
            setState('ended')
            break
        }
      }
    }

    start()

    return () => {
      cancelled = true
      wsRef.current?.close()
      pcRef.current?.close()
      for (const track of localStreamRef.current?.getTracks() ?? []) track.stop()
    }
  }, [appointmentId, kind, token])

  function toggleMic() {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setMicOn(track.enabled)
  }

  function toggleCamera() {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setCameraOn(track.enabled)
  }

  function leaveCall() {
    // No explicit "complete" here: the server completes a telemedicine
    // consultation once both participants have left (or the prescription is
    // issued), so a dropped connection can still rejoin.
    teardown()
    setEndReason('left')
    setState('ended')
  }

  if (!token) return null

  if (state === 'ended') {
    const dashboard = isDoctor ? '/doctor/dashboard' : '/dashboard'
    let title = 'Call ended'
    let body = 'You can rejoin from your dashboard while the consultation is still open.'
    if (kind === 'telemedicine' && endReason === 'completed') {
      title = 'Consultation complete'
      body = isDoctor
        ? 'The prescription has been sent to the patient.'
        : "Your prescription is ready — we've emailed you, and you can view or download it from your dashboard."
    } else if (kind === 'telemedicine' && !isDoctor) {
      body =
        "Your doctor is preparing your prescription. We'll email you as soon as it's ready, and it will also appear on your dashboard."
    } else if (kind === 'telemedicine' && isDoctor) {
      body = 'Write the prescription from Consultation history on your dashboard — that completes the consultation.'
    }
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4">
        <div className="card-raised w-full max-w-md p-8 text-center">
          <span className="icon-badge mx-auto h-14 w-14">
            <CheckCircle2 className="h-6 w-6 text-primary-600" />
          </span>
          <h1 className="mt-4 text-lg font-bold text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink/60">{body}</p>
          <Link
            to={endReason === 'completed' && !isDoctor ? '/dashboard#prescriptions' : dashboard}
            className="btn-raised mt-6 inline-block w-full"
          >
            {endReason === 'completed' && !isDoctor ? 'View prescription' : 'Go to dashboard'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-5xl flex-col px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold text-ink">Video consultation</h1>
      {error && (
        <p className="mt-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      {!error && state === 'waiting' && !peerLeft && (
        <p className="mt-2 text-sm text-ink/50">Waiting for the other participant to join…</p>
      )}
      {!error && state === 'waiting' && peerLeft && (
        <p className="mt-2 rounded-xl bg-primary/5 px-4 py-3 text-sm text-ink/70">
          {isDoctor
            ? 'The patient has left the call. You can end here and send the prescription from your dashboard.'
            : "The doctor has left the call. They're preparing your prescription — we'll email you when it's ready. You can hang up now."}
        </p>
      )}

      <div className="relative mt-4 flex-1 overflow-hidden rounded-2xl bg-ink">
        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
        {needsTap && (
          <button
            type="button"
            onClick={() => {
              remoteVideoRef.current?.play().then(() => setNeedsTap(false)).catch(() => {})
            }}
            className="absolute inset-0 flex items-center justify-center bg-ink/60 text-sm font-semibold text-white"
          >
            Tap to start video
          </button>
        )}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 h-32 w-24 rounded-xl border-2 border-white/80 object-cover shadow-lg sm:h-40 sm:w-32"
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={toggleMic}
          className={`icon-badge h-12 w-12 ${!micOn ? 'bg-danger/10' : ''}`}
          aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5 text-danger" />}
        </button>
        <button
          type="button"
          onClick={toggleCamera}
          className={`icon-badge h-12 w-12 ${!cameraOn ? 'bg-danger/10' : ''}`}
          aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
        >
          {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5 text-danger" />}
        </button>
        <button
          type="button"
          onClick={leaveCall}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-danger text-white shadow-md hover:bg-danger/90"
          aria-label="Leave call"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
