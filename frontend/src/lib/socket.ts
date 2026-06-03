import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sc_token') : null
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    })
    socket.on('connect',       () => console.log('🔌 Socket connected:', socket?.id))
    socket.on('disconnect',    (r) => console.log('🔌 Socket disconnected:', r))
    socket.on('connect_error', (e) => console.error('🔌 Socket error:', e.message))
  }
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
