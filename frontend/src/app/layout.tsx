import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'SphereChat — Meet the World',
  description: 'AI-powered global stranger chat. Safe, interest-based, real connections.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#13131a',
              color: '#e8e8f0',
              border: '1px solid #2a2a3e',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}
