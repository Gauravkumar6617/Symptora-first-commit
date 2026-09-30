import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { callSocketUrl } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// ponytail: public STUN only, no TURN — calls between peers on restrictive
// symmetric NATs may fail to connect. Add a TURN server if that happens in practice.
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

type CallState = 'connecting' | 'waiting' | 'in-call' | 'ended'

export function CallPage() {
  const { kind, id = '' } = useParams<{ kind: 'appointment' | 'telemedicine'; id: string }>()
  const appointmentId = id
  const token = useAuthStore((state) => state.token)
  const navigate = useNavigate()

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const [state, setState] = useState<CallState>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    function send(message: Record<string, unknown>) {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(message))
    }

    function ensurePeerConnection() {
      if (pcRef.current) return pcRef.current
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      pc.onicecandidate = (e) => {
        if (e.candidate) send({ type: 'ice-candidate', candidate: e.candidate })
      }
      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]
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
        if (e.code === 4410) setError('This consultation has ended. You can still message the doctor and see prescriptions from your dashboard.')
        else if (e.code === 4403) setError('You are not allowed to join this call.')
        else if (e.code === 4409) setError('This call already has both participants.')
      }

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data)
        const pc = ensurePeerConnection()
        switch (message.type) {
          case 'peer-joined': {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            send({ type: 'offer', sdp: offer })
            break
          }
          case 'offer': {
            await pc.setRemoteDescription(new RTCSessionDescription(message.sdp))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            send({ type: 'answer', sdp: answer })
            break
          }
          case 'answer':
            await pc.setRemoteDescription(new RTCSessionDescription(message.sdp))
            break
          case 'ice-candidate':
            try {
              await pc.addIceCandidate(new RTCIceCandidate(message.candidate))
            } catch {
              // a stray candidate arriving before setRemoteDescription is harmless to drop
            }
            break
          case 'peer-left':
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
            setState('waiting')
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
    wsRef.current?.close()
    pcRef.current?.close()
    for (const track of localStreamRef.current?.getTracks() ?? []) track.stop()
    // No explicit "complete" here: the server completes a telemedicine
    // consultation once both participants have left, so a single dropped
    // connection can still rejoin and hanging up never kicks the other side.
    setState('ended')
    navigate(-1)
  }

  if (!token) return null

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-5xl flex-col px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold text-ink">Video consultation</h1>
      {error && (
        <p className="mt-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      {!error && state === 'waiting' && (
        <p className="mt-2 text-sm text-ink/50">Waiting for the other participant to join…</p>
      )}

      <div className="relative mt-4 flex-1 overflow-hidden rounded-2xl bg-ink">
        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
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
