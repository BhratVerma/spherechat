'use client'
import { useEffect, useState } from 'react'

const TIPS: Record<string, string> = {
  TALK:     'Matching by your shared interests...',
  LANGUAGE: 'Finding a language exchange partner...',
  DEBATE:   'Finding someone who disagrees with you...',
  GAME:     'Finding a gaming partner...',
}

const COLORS: Record<string, string> = {
  TALK: '#6b8fff', LANGUAGE: '#4ecdc4', DEBATE: '#f7b731', GAME: '#fc5c65'
}

export default function MatchQueue({ mode, onCancel }: { mode: string; onCancel: () => void }) {
  const [secs, setSecs] = useState(0)
  const color = COLORS[mode] || '#6b8fff'

  useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>

      {/* Animated rings */}
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${color}`, animation: 'ping 1.5s ease-out infinite', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: `2px solid ${color}`, animation: 'ping 1.5s ease-out 0.4s infinite', opacity: 0.3 }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🌍</div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#5050a0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
          {mode.charAt(0) + mode.slice(1).toLowerCase().replace('_',' ')} Mode
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e8e8f0', marginBottom: 8 }}>Finding your match...</h2>
        <p style={{ fontSize: 14, color: '#6060a0' }}>{TIPS[mode]}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 999, padding: '9px 20px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
        <span style={{ fontSize: 14, color: '#7070a0' }}>Searching for {secs}s</span>
      </div>

      <button onClick={onCancel} style={{ background: 'transparent', color: '#5050a0', border: '1px solid #2a2a3e', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}>
        Cancel
      </button>

      <style>{`
        @keyframes ping  { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.6);opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.2} }
      `}</style>
    </div>
  )
}
