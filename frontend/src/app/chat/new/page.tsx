'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import VideoPanel from '@/components/chat/VideoPanel'
import ChatBox from '@/components/chat/ChatBox'
import MatchQueue from '@/components/chat/MatchQueue'
import { useSocket } from '@/hooks/useSocket'
import { useWebRTC } from '@/hooks/useWebRTC'
import type { PartnerInfo, RoomMode } from '@/types'

export default function ChatPage() {
  const router = useRouter()

  const [user]       = useState<any>(() => typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('sc_user') || 'null') : null)
  const [mode]       = useState<RoomMode>(() => typeof window !== 'undefined' ? (localStorage.getItem('sc_mode') as RoomMode || 'TALK') : 'TALK')
  const [partner, setPartner]           = useState<PartnerInfo | null>(null)
  const [isMatched, setIsMatched]       = useState(false)
  const [isInitiator, setIsInitiator]   = useState(false)
  const [matchedRoomId, setMatchedRoom] = useState<string | null>(null)
  const [showVerdict, setShowVerdict]   = useState(false)

  useEffect(() => { if (!user) router.push('/login') }, [user, router])

  const {
    isQueued, roomId, messages, isPartnerTyping, debateVerdict,
    sendMessage, sendTypingStart, sendTypingStop, nextStranger, requestVerdict,
    socket,
  } = useSocket({
    mode,
    interests: user?.interests || [],
    preferredLang: 'en',
    onMatchFound: (rId, _mode, initiator) => {
      setMatchedRoom(rId)
      setIsInitiator(initiator)
      setIsMatched(true)
      toast.success('Match found! Starting video...')
    },
    onPartnerInfo: (p) => setPartner(p),
    onPartnerLeft: () => {
      toast('Your partner left the chat 👋', { icon: '👋' })
      setIsMatched(false)
      setPartner(null)
      setMatchedRoom(null)
      setShowVerdict(false)
    },
  })

  const {
    localRef, remoteRef, isVideoConnected, isVideoLoading,
    isMuted, isCameraOff, videoError, toggleMute, toggleCamera,
  } = useWebRTC(isMatched ? matchedRoomId : null, socket, isInitiator)

  function handleNext() {
    nextStranger()
    setIsMatched(false)
    setPartner(null)
    setMatchedRoom(null)
    setIsInitiator(false)
    setShowVerdict(false)
    toast('Finding next stranger...', { icon: '🌍' })
  }

  function handleVerdict() {
    requestVerdict('General Debate')
    setShowVerdict(true)
    toast('Requesting AI verdict...')
  }

  if (!user) return null

  if (!isMatched) {
    return <MatchQueue mode={mode} onCancel={() => router.push('/dashboard')} />
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0f', color: '#e8e8f0', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #1a1a2e', flexShrink: 0, background: '#0d0d18' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: 'none', color: '#5050a0', cursor: 'pointer', fontSize: 20, padding: 4 }}>←</button>
          {partner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#6b8fff' }}>
                {partner.username[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>@{partner.username}</p>
                <p style={{ fontSize: 11, color: '#5050a0' }}>
                  🛡 {Math.round(partner.trustScore)} trust · {partner.interests.slice(0,2).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {mode === 'DEBATE' && (
            <button onClick={handleVerdict} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(247,183,49,0.1)', border: '1px solid rgba(247,183,49,0.3)', borderRadius: 9, padding: '8px 14px', color: '#f7b731', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              ⚖️ Get Verdict
            </button>
          )}
          <button onClick={() => toast('User reported. Our team will review this.')} style={{ background: 'rgba(252,92,101,0.1)', border: '1px solid rgba(252,92,101,0.3)', borderRadius: 9, padding: '8px 12px', color: '#fc5c65', cursor: 'pointer', fontSize: 13 }}>
            🚩 Report
          </button>
          <button onClick={handleNext} style={{ background: '#4a5fff', border: 'none', borderRadius: 9, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            ⏭ Next
          </button>
        </div>
      </div>

      {/* Main: video + chat */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', overflow: 'hidden', minHeight: 0 }}>

        {/* Left: video + verdict */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <VideoPanel
            localRef={localRef} remoteRef={remoteRef}
            isConnected={isVideoConnected} isLoading={isVideoLoading}
            isMuted={isMuted} isCameraOff={isCameraOff} videoError={videoError}
            partnerName={partner?.username}
            onToggleMute={toggleMute} onToggleCamera={toggleCamera}
          />

          {/* Debate verdict */}
          {showVerdict && debateVerdict && (
            <div style={{ background: 'rgba(247,183,49,0.07)', border: '1px solid rgba(247,183,49,0.2)', borderRadius: 12, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#f7b731', marginBottom: 10 }}>⚖️ AI Verdict</p>
              <p style={{ fontSize: 13, color: '#c8b060', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{debateVerdict}</p>
            </div>
          )}
          {showVerdict && !debateVerdict && (
            <div style={{ background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#5050a0' }}>Generating AI verdict...</p>
            </div>
          )}
        </div>

        {/* Right: chat */}
        <div style={{ borderLeft: '1px solid #1a1a2e', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <ChatBox
            messages={messages}
            myUserId={user.id}
            isPartnerTyping={isPartnerTyping}
            partnerName={partner?.username}
            disabled={!isMatched}
            onSend={sendMessage}
            onTypingStart={sendTypingStart}
            onTypingStop={sendTypingStop}
          />
        </div>
      </div>
    </div>
  )
}
