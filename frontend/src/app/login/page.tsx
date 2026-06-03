'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'

const INTERESTS = [
  '🎵 Music','🎬 Movies','📚 Books','💻 Tech','🎮 Gaming',
  '⚽ Sports','✈️ Travel','🍕 Food','🎨 Art','📸 Photography',
  '🧘 Fitness','💼 Business','🔬 Science','🌍 Politics','😂 Memes',
]

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep]           = useState<'phone'|'otp'|'profile'>('phone')
  const [phone, setPhone]         = useState('')
  const [otp, setOtp]             = useState('')
  const [username, setUsername]   = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [loading, setLoading]     = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)

  async function sendOTP() {
    if (!phone.trim()) { toast.error('Enter your phone number'); return }
    setLoading(true)
    try {
      await axios.post(`${API}/api/auth/send-otp`, { phone })
      toast.success('OTP sent! Check your backend terminal.')
      setStep('otp')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOTP() {
    if (otp.length !== 6) { toast.error('Enter the 6-digit code'); return }
    if (loading) return // prevent double call
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/auth/verify-otp`, {
        phone,
        code: otp,
      })

      if (res.data.isNewUser) {
        setIsNewUser(true)
        setStep('profile')
        toast('Set up your profile 👋')
        setLoading(false)
        return
      }

      // Existing user — save and redirect
      localStorage.setItem('sc_token', res.data.token)
      localStorage.setItem('sc_user', JSON.stringify(res.data.user))
      toast.success(`Welcome back, ${res.data.user.username}!`)
      router.push('/dashboard')
    } catch (e: any) {
      const err = e.response?.data
      if (err?.isNewUser) {
        setIsNewUser(true)
        setStep('profile')
        setLoading(false)
        return
      }
      toast.error(err?.error || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  async function completeProfile() {
    if (username.length < 3) { toast.error('Username must be 3+ characters'); return }
    if (interests.length < 2) { toast.error('Pick at least 2 interests'); return }
    if (loading) return // prevent double call
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/auth/verify-otp`, {
        phone,
        code: otp,
        username,
        interests,
      })
      localStorage.setItem('sc_token', res.data.token)
      localStorage.setItem('sc_user', JSON.stringify(res.data.user))
      toast.success(`Welcome, ${res.data.user.username}! 🎉`)
      router.push('/dashboard')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  function toggleInterest(i: string) {
    setInterests(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])
  }

  const inputStyle = {
    width: '100%', background: '#0d0d18', border: '1px solid #2a2a3e',
    borderRadius: 10, padding: '13px 16px', color: '#e8e8f0', fontSize: 15,
    outline: 'none', boxSizing: 'border-box' as const,
  }

  const btnStyle = {
    width: '100%', background: loading ? '#2a2a3e' : '#6b8fff',
    color: '#fff', border: 'none', borderRadius: 10, padding: '13px',
    fontWeight: 700, fontSize: 15,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontSize: 44, marginBottom: 10 }}>🌍</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#e8e8f0' }}>SphereChat</h1>
          <p style={{ color: '#6060a0', fontSize: 14, marginTop: 6 }}>
            {step === 'phone'   ? 'Enter your phone to get started' :
             step === 'otp'     ? `Enter the code shown in your backend terminal` :
             'Almost done! Set up your profile'}
          </p>
        </div>

        <div className="glass" style={{ borderRadius: 20, padding: 32 }}>

          {/* STEP: phone */}
          {step === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: '#8080b0', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Phone Number
                </label>
                <input
                  style={inputStyle}
                  type="tel"
                  placeholder="+919876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && sendOTP()}
                />
                <p style={{ fontSize: 12, color: '#5050a0', marginTop: 8, lineHeight: 1.5 }}>
                  Include country code. India: +91XXXXXXXXXX
                </p>
              </div>
              <button style={btnStyle} onClick={sendOTP} disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP →'}
              </button>
            </div>
          )}

          {/* STEP: otp */}
          {step === 'otp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: '#8080b0', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  6-Digit Code
                </label>
                <input
                  style={{ ...inputStyle, fontSize: 28, letterSpacing: 12, textAlign: 'center' }}
                  type="text"
                  maxLength={6}
                  placeholder="······"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && !loading && verifyOTP()}
                />
                <p style={{ fontSize: 12, color: '#5050a0', marginTop: 8 }}>
                  Check your backend terminal (Terminal 1 in VS Code) for the code
                </p>
              </div>
              <button style={btnStyle} onClick={verifyOTP} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code →'}
              </button>
              <button
                onClick={() => { setStep('phone'); setOtp('') }}
                style={{ background: 'transparent', color: '#6060a0', border: 'none', fontSize: 13, cursor: 'pointer', padding: '6px' }}
              >
                ← Change number
              </button>
            </div>
          )}

          {/* STEP: profile */}
          {step === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, color: '#8080b0', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Choose Username
                </label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="cooluser123"
                  maxLength={20}
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#8080b0', display: 'block', marginBottom: 10, fontWeight: 500 }}>
                  Your Interests <span style={{ color: '#4040a0' }}>({interests.length} selected, min 2)</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {INTERESTS.map(i => (
                    <button key={i} onClick={() => toggleInterest(i)} style={{
                      padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                      border: `1px solid ${interests.includes(i) ? '#6b8fff' : '#2a2a3e'}`,
                      background: interests.includes(i) ? 'rgba(107,143,255,0.15)' : 'transparent',
                      color: interests.includes(i) ? '#6b8fff' : '#7070a0',
                      fontWeight: interests.includes(i) ? 600 : 400,
                    }}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <button style={btnStyle} onClick={completeProfile} disabled={loading}>
                {loading ? 'Creating...' : 'Enter SphereChat 🌍'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}