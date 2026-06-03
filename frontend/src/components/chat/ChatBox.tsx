'use client'
import { useEffect, useRef, useState } from 'react'
import type { Message } from '@/types'

interface Props {
  messages:        Message[]
  myUserId:        string
  isPartnerTyping: boolean
  partnerName?:    string
  disabled?:       boolean
  onSend:          (content: string) => void
  onTypingStart:   () => void
  onTypingStop:    () => void
}

export default function ChatBox({ messages, myUserId, isPartnerTyping, partnerName, disabled, onSend, onTypingStart, onTypingStop }: Props) {
  const [input, setInput]   = useState('')
  const bottomRef           = useRef<HTMLDivElement>(null)
  const timerRef            = useRef<NodeJS.Timeout>()
  const typingRef           = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isPartnerTyping])

  function send() {
    const t = input.trim()
    if (!t || disabled) return
    onSend(t)
    setInput('')
    if (typingRef.current) { onTypingStop(); typingRef.current = false }
    clearTimeout(timerRef.current)
  }

  function onChange(v: string) {
    setInput(v)
    if (!typingRef.current) { onTypingStart(); typingRef.current = true }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { onTypingStop(); typingRef.current = false }, 1500)
  }

  function time(d: string | Date) {
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const verdictColor = { safe: '#4ecdc4', warning: '#f7b731', toxic: '#fc5c65' } as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', marginTop: 48, color: '#3a3a5a', fontSize: 14 }}>
            Say hi to {partnerName || 'your match'} 👋
          </p>
        )}

        {messages.map(msg => {
          const isMe = msg.senderId === myUserId
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.2s ease' }}>
              {!isMe && <p style={{ fontSize: 11, color: '#5050a0', marginBottom: 4, paddingLeft: 2 }}>{msg.senderName}</p>}
              <div style={{ maxWidth: '76%' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.isBlocked ? '#1a0808'
                    : msg.modVerdict === 'toxic' ? '#1a0808'
                    : isMe ? '#4a5fff'
                    : '#16162a',
                  border: msg.modVerdict === 'warning' ? '1px solid rgba(247,183,49,0.4)' : 'none',
                  wordBreak: 'break-word',
                }}>
                  <p style={{
                    fontSize: 14, lineHeight: 1.55,
                    color: msg.isBlocked || msg.modVerdict === 'toxic' ? '#5a2020' : isMe ? '#fff' : '#e0e0f0',
                    fontStyle: msg.isBlocked ? 'italic' : 'normal',
                  }}>
                    {msg.content}
                  </p>
                  {msg.translated && msg.translated !== msg.content && (
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 5, fontStyle: 'italic' }}>
                      🌐 {msg.translated}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, paddingLeft: 2 }}>
                  <span style={{ fontSize: 11, color: '#3a3a5a' }}>{time(msg.createdAt)}</span>
                  {msg.modVerdict && msg.modVerdict !== 'safe' && (
                    <span style={{ fontSize: 10, color: verdictColor[msg.modVerdict], background: `${verdictColor[msg.modVerdict]}15`, border: `1px solid ${verdictColor[msg.modVerdict]}30`, padding: '1px 7px', borderRadius: 999 }}>
                      {msg.modVerdict === 'warning' ? '⚠️ caution' : '🚫 removed'}
                    </span>
                  )}
                  {msg.modStatus === 'PENDING' && <span style={{ fontSize: 10, color: '#3a3a5a' }}>checking...</span>}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {isPartnerTyping && (
          <div style={{ display: 'flex' }}>
            <div style={{ padding: '10px 16px', background: '#16162a', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#5050a0', display: 'inline-block', animation: `bounce 1.2s ${i*0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #16162a', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder={disabled ? 'Waiting for a match...' : 'Type a message… (Enter to send)'}
          disabled={disabled}
          rows={1}
          style={{ flex: 1, background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 10, padding: '10px 14px', color: '#e8e8f0', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, maxHeight: 96, overflowY: 'auto' }}
        />
        <button onClick={send} disabled={disabled || !input.trim()} style={{ width: 40, height: 40, borderRadius: 10, background: '#4a5fff', border: 'none', cursor: 'pointer', fontSize: 18, flexShrink: 0, opacity: disabled || !input.trim() ? 0.3 : 1, transition: 'opacity 0.15s' }}>
          ➤
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}
