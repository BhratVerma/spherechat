'use client'

interface Props {
  localRef:       React.RefObject<HTMLVideoElement>
  remoteRef:      React.RefObject<HTMLVideoElement>
  isConnected:    boolean
  isLoading:      boolean
  isMuted:        boolean
  isCameraOff:    boolean
  videoError:     string | null
  partnerName?:   string
  onToggleMute:   () => void
  onToggleCamera: () => void
}

export default function VideoPanel({
  localRef, remoteRef, isConnected, isLoading,
  isMuted, isCameraOff, videoError, partnerName,
  onToggleMute, onToggleCamera,
}: Props) {
  return (
    <div style={{ position: 'relative', background: '#050508', borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9', width: '100%' }}>

      {/* Remote video */}
      <video
        ref={remoteRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: isConnected ? 'block' : 'none' }}
      />

      {/* States */}
      {!isConnected && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }}>
          {isLoading ? (
            <>
              <div style={{ width: 40, height: 40, border: '2px solid #6b8fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: '#5050a0', fontSize: 14 }}>Starting camera...</p>
            </>
          ) : videoError ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🎤</p>
              <p style={{ color: '#f7b731', fontSize: 14, maxWidth: 280, lineHeight: 1.6 }}>
                {videoError}
              </p>
              <p style={{ color: '#5050a0', fontSize: 13, marginTop: 8 }}>
                Text chat is working below ↓
              </p>
            </div>
          ) : (
            <>
              <div style={{ width: 40, height: 40, border: '2px solid #6b8fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: '#5050a0', fontSize: 14 }}>
                Connecting to {partnerName || 'partner'}...
              </p>
            </>
          )}
        </div>
      )}

      {/* Partner name */}
      {isConnected && partnerName && (
        <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.65)', borderRadius: 999, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, background: '#4ecdc4', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 13, color: '#e8e8f0', fontWeight: 500 }}>@{partnerName}</span>
        </div>
      )}

      {/* Live badge */}
      {isConnected && (
        <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.65)', borderRadius: 999, padding: '4px 10px' }}>
          <span style={{ fontSize: 11, color: '#4ecdc4', fontWeight: 600 }}>● LIVE</span>
        </div>
      )}

      {/* Local PiP */}
      <div style={{ position: 'absolute', bottom: 14, right: 14, width: '22%', aspectRatio: '4/3', background: '#0d0d1e', borderRadius: 10, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.08)' }}>
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: isCameraOff ? 'none' : 'block' }}
        />
        {isCameraOff && (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            📷
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10 }}>
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          style={{ width: 44, height: 44, borderRadius: '50%', background: isMuted ? 'rgba(252,92,101,0.8)' : 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 18 }}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>
        <button
          onClick={onToggleCamera}
          title={isCameraOff ? 'Camera on' : 'Camera off'}
          style={{ width: 44, height: 44, borderRadius: '50%', background: isCameraOff ? 'rgba(252,92,101,0.8)' : 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 18 }}
        >
          {isCameraOff ? '📷' : '📹'}
        </button>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  )
}