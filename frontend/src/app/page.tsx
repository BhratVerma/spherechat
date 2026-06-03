'use client'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0', fontFamily: 'Inter, sans-serif' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #1a1a2e' }}>
        <span style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(90deg,#6b8fff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🌍 SphereChat
        </span>
        <Link href="/login">
          <button style={{ background: '#6b8fff', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Get Started →
          </button>
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 20px 80px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(107,143,255,0.1)', border: '1px solid rgba(107,143,255,0.3)', borderRadius: 999, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ecdc4', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 13, color: '#6b8fff', fontWeight: 500 }}>Safe · AI-moderated · Legal in India</span>
        </div>

        <h1 style={{ fontSize: 'clamp(38px,7vw,76px)', fontWeight: 800, lineHeight: 1.08, marginBottom: 24, letterSpacing: '-2px' }}>
          Meet the world.<br />
          <span style={{ background: 'linear-gradient(90deg,#6b8fff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            With purpose.
          </span>
        </h1>

        <p style={{ fontSize: 18, color: '#7070a0', maxWidth: 520, margin: '0 auto 44px', lineHeight: 1.7 }}>
          The modern stranger chat. AI matches you by interest, moderates every conversation, and makes every connection feel meaningful — unlike anything before it.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login">
            <button style={{ background: 'linear-gradient(135deg,#6b8fff,#4f6ef7)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 36px', fontWeight: 800, fontSize: 17, cursor: 'pointer', boxShadow: '0 8px 40px rgba(107,143,255,0.35)' }}>
              Start Chatting Free →
            </button>
          </Link>
        </div>
      </section>

      {/* Modes */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '60px 20px 80px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, marginBottom: 40 }}>Four ways to connect</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          {[
            { icon: '💬', title: 'Just Talk',          desc: 'Matched by shared interests. Could be anyone, anywhere.',   color: '#6b8fff' },
            { icon: '🌐', title: 'Language Exchange',   desc: 'Practice a new language. AI translates in real time.',      color: '#4ecdc4' },
            { icon: '⚖️', title: 'Debate Mode',         desc: 'AI fact-checks and scores every argument live.',            color: '#f7b731' },
            { icon: '🎮', title: 'Play Together',        desc: 'Break the ice with live trivia and word games.',           color: '#fc5c65' },
          ].map(m => (
            <div key={m.title} className="glass" style={{ borderRadius: 18, padding: '26px 22px' }}>
              <div style={{ fontSize: 30, marginBottom: 12 }}>{m.icon}</div>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#e8e8f0' }}>{m.title}</p>
              <p style={{ fontSize: 13, color: '#7070a0', lineHeight: 1.6 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Safety */}
      <section style={{ background: '#0d0d18', borderTop: '1px solid #1a1a2e', borderBottom: '1px solid #1a1a2e', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🛡️</p>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 14 }}>Built safe from the ground up</h2>
          <p style={{ color: '#7070a0', lineHeight: 1.9, fontSize: 15 }}>
            Phone verification on every account. AI moderation on every message. One-tap reporting. Auto-ban after 5 violations. This is why SphereChat operates where Omegle could not.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 16 }}>Your next meaningful conversation is waiting.</h2>
        <Link href="/login">
          <button style={{ background: 'linear-gradient(135deg,#6b8fff,#4f6ef7)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 40px', fontWeight: 800, fontSize: 17, cursor: 'pointer', boxShadow: '0 8px 40px rgba(107,143,255,0.35)', marginTop: 20 }}>
            Create Free Account →
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1a1a2e', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 13, color: '#4a4a6a' }}>© 2025 SphereChat</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy Policy', 'Terms of Service', 'Report Abuse'].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: '#4a4a6a', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}
