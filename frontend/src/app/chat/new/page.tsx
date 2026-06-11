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

  const [user] = useState<any>(() =>
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('sc_user') || 'null')
      : null
  )
  const [mode] = useState<RoomMode>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem('sc_mode') as RoomMode || 'TALK')
      : 'TALK'
  )

  const [partner, setPartner]         = useState<PartnerInfo | null>(null)
  const [isMatched, setIsMatched]     = useState(false)
  const [isInitiator, setIsInitiator] = useState(false)
  const [matchedRoomId, setMatchedRoom] = useState<string | null>(null)
  const [showVerdict, setShowVerdict] = useState(false)
  const [activeTab, setActiveTab]     = useState<'video' | 'chat'>('video')

  useEffect(() => { if (!user) router.push('/login') }, [user, router])

  const {
    isQueued, roomId, messages, isPartnerTyping, debateVerdict,
    sendMessage, sendTypingStart, sendTypingStop,
    nextStranger, requestVerdict, socket,
  } = useSocket({
    mode,
    interests: user?.interests || [],
    preferredLang: 'en',
    onMatchFound: (rId, _mode, initiator) => {
      setMatchedRoom(rId)
      setIsInitiator(initiator)
      setIsMatched(true)
      toast.success('Match found!')
    },
    onPartnerInfo: (p) => setPartner(p),
    onPartnerLeft: () => {
      toast('Your partner left 👋')
      setIsMatched(false)
      setPartner(null)
      setMatchedRoom(null)
      setShowVerdict(false)
    },
  })

  const {
    localRef, remoteRef,
    isVideoConnected, isVideoLoading,
    isMuted, isCameraOff, videoError,
    toggleMute, toggleCamera,
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

  if (!user) return null
  if (!isMatched) {
    return <MatchQueue mode={mode} onCancel={() => router.push('/dashboard')} />
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0f',
      color: '#e8e8f0',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden',
    }}>

      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid #1a1a2e',
        flexShrink: 0,
        background: '#0d0d18',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: 'none', color: '#5050a0', cursor: 'pointer', fontSize: 20 }}>←</button>
          {partner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#6b8fff' }}>
                {partner.username[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13 }}>@{partner.username}</p>
                <p style={{ fontSize: 10, color: '#5050a0' }}>🛡 {Math.round(partner.trustScore)} trust</p>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {mode === 'DEBATE' && (
            <button onClick={() => { requestVerdict('General Debate'); setShowVerdict(true) }}
              style={{ background: 'rgba(247,183,49,0.1)', border: '1px solid rgba(247,183,49,0.3)', borderRadius: 8, padding: '6px 10px', color: '#f7b731', cursor: 'pointer', fontSize: 12 }}>
              ⚖️ Verdict
            </button>
          )}
          <button onClick={() => toast('User reported.')}
            style={{ background: 'rgba(252,92,101,0.1)', border: '1px solid rgba(252,92,101,0.3)', borderRadius: 8, padding: '6px 10px', color: '#fc5c65', cursor: 'pointer', fontSize: 12 }}>
            🚩
          </button>
          <button onClick={handleNext}
            style={{ background: '#4a5fff', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            ⏭ Next
          </button>
        </div>
      </div>

      {/* Mobile tab switcher */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #1a1a2e',
        flexShrink: 0,
        background: '#0d0d18',
      }}>
        <button
          onClick={() => setActiveTab('video')}
          style={{
            flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: activeTab === 'video' ? 'rgba(107,143,255,0.1)' : 'transparent',
            color: activeTab === 'video' ? '#6b8fff' : '#5050a0',
            borderBottom: activeTab === 'video' ? '2px solid #6b8fff' : '2px solid transparent',
          }}>
          📹 Video
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: activeTab === 'chat' ? 'rgba(107,143,255,0.1)' : 'transparent',
            color: activeTab === 'chat' ? '#6b8fff' : '#5050a0',
            borderBottom: activeTab === 'chat' ? '2px solid #6b8fff' : '2px solid transparent',
            position: 'relative',
          }}>
          💬 Chat
          {messages.length > 0 && activeTab === 'video' && (
            <span style={{ position: 'absolute', top: 8, right: 20, width: 8, height: 8, borderRadius: '50%', background: '#fc5c65' }} />
          )}
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Video tab */}
        {activeTab === 'video' && (
          <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
            <VideoPanel
              localRef={localRef}
              remoteRef={remoteRef}
              isConnected={isVideoConnected}
              isLoading={isVideoLoading}
              isMuted={isMuted}
              isCameraOff={isCameraOff}
              videoError={videoError}
              partnerName={partner?.username}
              onToggleMute={toggleMute}
              onToggleCamera={toggleCamera}
            />
            {showVerdict && debateVerdict && (
              <div style={{ background: 'rgba(247,183,49,0.07)', border: '1px solid rgba(247,183,49,0.2)', borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#f7b731', marginBottom: 8 }}>⚖️ AI Verdict</p>
                <p style={{ fontSize: 13, color: '#c8b060', lineHeight: 1.7 }}>{debateVerdict}</p>
              </div>
            )}
          </div>
        )}

        {/* Chat tab */}
        {activeTab === 'chat' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
        )}
      </div>
    </div>
  )
}