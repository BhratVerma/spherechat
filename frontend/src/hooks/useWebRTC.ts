import { useEffect, useRef, useState, useCallback } from 'react'
import { Socket } from 'socket.io-client'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
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
        // Try video + audio first
        let localStream: MediaStream | null = null

        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
        } catch (err: any) {
          console.warn('Video+audio failed, trying audio only:', err.name)

          // Try audio only if camera fails
          try {
            localStream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            })
            setVideoError('Camera not available — voice only mode active.')
          } catch (audioErr: any) {
            console.warn('Audio also failed, continuing without media:', audioErr.name)
            // Continue without any media — text chat still works
            localStream = null
            setVideoError(null)
          }
        }

        if (cancelled) {
          localStream?.getTracks().forEach(t => t.stop())
          return
        }

        stream.current = localStream

        if (localStream && localRef.current) {
          localRef.current.srcObject = localStream
        }

        setVideoLoading(false)

        // Create peer connection
        const peer = new RTCPeerConnection(ICE_SERVERS)
        pc.current = peer

        // Add tracks if we have a stream
        if (localStream) {
          localStream.getTracks().forEach(t => peer.addTrack(t, localStream!))
        }

        // When remote stream arrives
        peer.ontrack = (e) => {
          if (remoteRef.current && e.streams[0]) {
            remoteRef.current.srcObject = e.streams[0]
            setVideoConnected(true)
          }
        }

        // Send ICE candidates
        peer.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit('webrtc_ice_candidate', {
              roomId,
              candidate: e.candidate,
            })
          }
        }

        peer.onconnectionstatechange = () => {
          console.log('WebRTC state:', peer.connectionState)
          if (peer.connectionState === 'connected') setVideoConnected(true)
          if (peer.connectionState === 'failed') {
            setVideoError('Video connection failed. Chat still works below!')
            setVideoConnected(false)
          }
        }

        // Start WebRTC handshake
        if (isInitiator) {
          const offer = await peer.createOffer()
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
            console.warn('ICE candidate error:', e)
          }
        })

      } catch (err: any) {
        if (!cancelled) {
          console.error('WebRTC init error:', err)
          setVideoError('Video unavailable. You can still text chat below!')
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
    if (track) {
      track.enabled = !track.enabled
      setMuted(!track.enabled)
    }
  }, [])

  const toggleCamera = useCallback(() => {
    const track = stream.current?.getVideoTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setCameraOff(!track.enabled)
    }
  }, [])

  return {
    localRef,
    remoteRef,
    isVideoConnected,
    isVideoLoading,
    isMuted,
    isCameraOff,
    videoError,
    toggleMute,
    toggleCamera,
  }
}