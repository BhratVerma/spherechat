import { useEffect, useRef, useState, useCallback } from 'react'
import { Socket } from 'socket.io-client'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:relay.metered.ca:80',
      username: 'f43592633a53758bb23b4a3b',
      credential: '797203b6f30b32005c256a0a9823426fe3d7',
    },
    {
      urls: 'turn:relay.metered.ca:443',
      username: 'f43592633a53758bb23b4a3b',
      credential: '797203b6f30b32005c256a0a9823426fe3d7',
    },
    {
      urls: 'turns:relay.metered.ca:443',
      username: 'f43592633a53758bb23b4a3b',
      credential: '797203b6f30b32005c256a0a9823426fe3d7',
    },
  ],
}

function playVideo(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    if (video.readyState >= 2) {
      video.play().then(resolve).catch(() => resolve())
    } else {
      video.onloadeddata = () => {
        video.play().then(resolve).catch(() => resolve())
      }
    }
  })
}

export function useWebRTC(
  roomId: string | null,
  socket: Socket,
  isInitiator: boolean
) {
  const localRef  = useRef<HTMLVideoElement>(null)
  const remoteRef = useRef<HTMLVideoElement>(null)
  const pc        = useRef<RTCPeerConnection | null>(null)
  const stream    = useRef<MediaStream | null>(null)

  const [isVideoConnected, setVideoConnected] = useState(false)
  const [isVideoLoading, setVideoLoading]     = useState(true)
  const [isMuted, setMuted]                   = useState(false)
  const [isCameraOff, setCameraOff]           = useState(false)
  const [videoError, setVideoError]           = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) return
    let cancelled = false

    async function init() {
      try {
        let localStream: MediaStream | null = null

        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: { echoCancellation: true, noiseSuppression: true },
          })
        } catch {
          try {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            setVideoError('Camera not available — voice only mode active.')
          } catch {
            setVideoError('Please allow camera and microphone access.')
            setVideoLoading(false)
            return
          }
        }

        if (cancelled) { localStream?.getTracks().forEach(t => t.stop()); return }

        stream.current = localStream
        setVideoLoading(false)

        // Attach local stream
        if (localRef.current) {
          localRef.current.srcObject = localStream
          localRef.current.muted = true
          await playVideo(localRef.current)
        }

        // Create peer connection
        const peer = new RTCPeerConnection(ICE_SERVERS)
        pc.current = peer

        localStream.getTracks().forEach(track => peer.addTrack(track, localStream!))

        peer.ontrack = async (event) => {
          console.log('Remote track received:', event.track.kind)
          if (remoteRef.current && event.streams[0]) {
            remoteRef.current.srcObject = event.streams[0]
            await playVideo(remoteRef.current)
            setVideoConnected(true)
          }
        }

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc_ice_candidate', { roomId, candidate: event.candidate })
          }
        }

        peer.oniceconnectionstatechange = () => {
          console.log('ICE:', peer.iceConnectionState)
          if (['connected', 'completed'].includes(peer.iceConnectionState)) {
            setVideoConnected(true)
          }
        }

        peer.onconnectionstatechange = () => {
          console.log('Connection:', peer.connectionState)
          if (peer.connectionState === 'connected') setVideoConnected(true)
        }

        if (isInitiator) {
          const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
          await peer.setLocalDescription(offer)
          socket.emit('webrtc_offer', { roomId, offer })
        }

        socket.on('webrtc_offer', async ({ offer }) => {
          if (peer.signalingState === 'stable') {
            await peer.setRemoteDescription(new RTCSessionDescription(offer))
            const answer = await peer.createAnswer()
            await peer.setLocalDescription(answer)
            socket.emit('webrtc_answer', { roomId, answer })
          }
        })

        socket.on('webrtc_answer', async ({ answer }) => {
          if (peer.signalingState === 'have-local-offer') {
            await peer.setRemoteDescription(new RTCSessionDescription(answer))
          }
        })

        socket.on('webrtc_ice_candidate', async ({ candidate }) => {
          try {
            if (peer.remoteDescription) {
              await peer.addIceCandidate(new RTCIceCandidate(candidate))
            }
          } catch (e) {
            console.warn('ICE error:', e)
          }
        })

      } catch (err) {
        if (!cancelled) {
          console.error('WebRTC error:', err)
          setVideoError('Video unavailable. Text chat still works.')
          setVideoLoading(false)
        }
      }
    }

    init()

    return () => {
      cancelled = true
      pc.current?.close()
      stream.current?.getTracks().forEach(t => t.stop())
      socket.off('webrtc_offer')
      socket.off('webrtc_answer')
      socket.off('webrtc_ice_candidate')
    }
  }, [roomId, isInitiator])

  const toggleMute = useCallback(() => {
    const track = stream.current?.getAudioTracks()[0]
    if (track) { track.enabled = !track.enabled; setMuted(!track.enabled) }
  }, [])

  const toggleCamera = useCallback(() => {
    const track = stream.current?.getVideoTracks()[0]
    if (track) { track.enabled = !track.enabled; setCameraOff(!track.enabled) }
  }, [])

  return { localRef, remoteRef, isVideoConnected, isVideoLoading, isMuted, isCameraOff, videoError, toggleMute, toggleCamera }
}