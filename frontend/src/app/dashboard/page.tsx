'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const MODES = [
  { id: 'TALK',     icon: '💬', title: 'Just Talk',          desc: 'Meet a stranger matched to your interests.',                color: '#6b8fff', tag: 'Popular' },
  { id: 'LANGUAGE', icon: '🌐', title: 'Language Exchange',   desc: 'Practice a new language. AI translates in real time.',     color: '#4ecdc4', tag: 'Learn' },
  { id: 'DEBATE',   icon: '⚖️', title: 'Debate Mode',         desc: 'AI fact-checks your arguments and scores the debate.',     color: '#f7b731', tag: 'AI Judged' },
  { id: 'GAME',     icon: '🎮', title: 'Play Together',        desc: 'Break the ice with trivia and word games on video.',      color: '#fc5c65', tag: 'Fun' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser]       = useState<any>(null)
  const [mode, setMode]       = useState('TALK')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('sc_user')
    const t = localStorage.getItem('sc_token')
    if (!u || !t) { router.push('/login'); return }
    setUser(JSON.parse(u))
  }, [router])

  function start() {
    setLoading(true)
    localStorage.setItem('sc_mode', mode)
    router.push('/chat/new')
  }

  function logout() {
    localStorage.clear()
    router.push('/')
    toast('Logged out')
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #6b8fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0', fontFamily: 'Inter, sans-serif' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 32px', borderBottom: '1px solid #1a1a2e' }}>
        <span style={{ fontSize: 18, fontWeight: 800, background: 'linear-gradient(90deg,#6b8fff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🌍 SphereChat
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#13131a', border: '1px solid #2a2a3e', borderRadius: 999, padding: '7px 16px' }}>
            <span style={{ fontSize: 12, color: '#4ecdc4' }}>🛡 {Math.round(user.trustScore)} trust</span>
          </div>
          <span style={{ fontSize: 14, color: '#8080b0' }}>@{user.username}</span>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #2a2a3e', borderRadius: 8, padding: '7px 14px', color: '#6060a0', cursor: 'pointer', fontSize: 13 }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Hey, {user.username} 👋</h1>
        <p style={{ color: '#6060a0', fontSize: 14, marginBottom: 36 }}>
          {user.totalChats} chats completed · Select a mode and find your next connection
        </p>

        {/* Interests */}
        {user.interests?.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 12, color: '#5050a0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Matching by your interests</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {user.interests.map((i: string) => (
                <span key={i} style={{ padding: '5px 14px', background: 'rgba(107,143,255,0.08)', border: '1px solid rgba(107,143,255,0.2)', borderRadius: 999, fontSize: 13, color: '#8090d0' }}>
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mode cards */}
        <p style={{ fontSize: 12, color: '#5050a0', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Choose a mode</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 32 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              position: 'relative', background: mode === m.id ? `${m.color}10` : '#0d0d18',
              border: `2px solid ${mode === m.id ? m.color : '#1a1a2e'}`,
              borderRadius: 16, padding: '20px 18px', textAlign: 'left', cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              {m.tag && (
                <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 600, color: m.color, background: `${m.color}15`, padding: '2px 8px', borderRadius: 999 }}>
                  {m.tag}
                </span>
              )}
              <div style={{ fontSize: 28, marginBottom: 10 }}>{m.icon}</div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#e8e8f0', marginBottom: 5 }}>{m.title}</p>
              <p style={{ fontSize: 12, color: '#6060a0', lineHeight: 1.5 }}>{m.desc}</p>
            </button>
          ))}
        </div>

        {/* Find button */}
        <button onClick={start} disabled={loading} style={{
          width: '100%', background: 'linear-gradient(135deg,#6b8fff,#4f6ef7)', color: '#fff',
          border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 17,
          cursor: 'pointer', boxShadow: '0 8px 40px rgba(107,143,255,0.3)',
          opacity: loading ? 0.8 : 1, letterSpacing: 0.2,
        }}>
          {loading ? '🔍 Finding your match...' : `👥 Find a Stranger — ${MODES.find(m => m.id === mode)?.title}`}
        </button>

        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#4040a0' }}>
          🛡 AI moderation active · Phone-verified users only
        </p>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
