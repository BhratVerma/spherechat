import { Server, Socket } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import {
  addToQueue,
  removeFromQueue,
  findMatch,
  removeFromAllQueues,
  QueueEntry,
} from '../services/matching'
import { moderateMessage, generateDebateVerdict } from '../services/moderation'

const prisma = new PrismaClient()

// Track socket → room mapping
const socketRoomMap = new Map<string, string>()

export function initializeSocket(io: Server) {
  // ── Auth middleware for every socket connection ───────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error('No auth token provided'))

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

      if (!user) return next(new Error('User not found'))
      if (user.isBanned) return next(new Error('Account suspended'))

      socket.data.userId = decoded.userId
      socket.data.username = user.username
      next()
    } catch (err) {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const userId: string = socket.data.userId
    console.log(`✅ Socket connected: ${socket.data.username} [${socket.id}]`)

    // ────────────────────────────────────────────────────────
    //  JOIN QUEUE — user clicks "Find a Stranger"
    // ────────────────────────────────────────────────────────
    socket.on('join_queue', async ({ mode, interests, preferredLang }) => {
      try {
        const entry: QueueEntry = {
          userId,
          socketId: socket.id,
          mode: mode || 'TALK',
          interests: interests || [],
          preferredLang: preferredLang || 'en',
          joinedAt: Date.now(),
        }

        const match = await findMatch(entry)

        if (match) {
          // ── MATCH FOUND ──────────────────────────────────
          const room = await prisma.room.create({
            data: {
              mode: entry.mode as any,
              user1Id: userId,
              user2Id: match.userId,
            },
          })

          await removeFromQueue(userId, entry.mode)
          await removeFromQueue(match.userId, entry.mode)

          // Both join the same Socket.io room
          socket.join(room.id)
          const matchSocket = io.sockets.sockets.get(match.socketId)
          if (matchSocket) matchSocket.join(room.id)

          socketRoomMap.set(socket.id, room.id)
          socketRoomMap.set(match.socketId, room.id)

          // Get user info for each side
          const [myInfo, partnerInfo] = await Promise.all([
            prisma.user.findUnique({
              where: { id: userId },
              select: { username: true, trustScore: true, interests: true },
            }),
            prisma.user.findUnique({
              where: { id: match.userId },
              select: { username: true, trustScore: true, interests: true },
            }),
          ])

          // Notify current user — they are the WebRTC initiator (makes the offer)
          socket.emit('match_found', { roomId: room.id, mode: room.mode, isInitiator: true })
          socket.emit('partner_info', { partner: partnerInfo })

          // Notify matched user — they respond to the offer
          matchSocket?.emit('match_found', { roomId: room.id, mode: room.mode, isInitiator: false })
          matchSocket?.emit('partner_info', { partner: myInfo })

          console.log(`🔗 Room ${room.id}: ${socket.data.username} ↔ ${match.userId}`)
        } else {
          // ── NO MATCH YET — wait in queue ─────────────────
          await addToQueue(entry)
          socket.emit('queued', { message: 'Searching for a match...' })
          console.log(`🕐 ${socket.data.username} queued for ${entry.mode}`)
        }
      } catch (err) {
        console.error('join_queue error:', err)
        socket.emit('error', { message: 'Failed to join queue. Please refresh.' })
      }
    })

    // ────────────────────────────────────────────────────────
    //  SEND MESSAGE
    // ────────────────────────────────────────────────────────
    socket.on('send_message', async ({ roomId, content }) => {
      if (!content?.trim() || !roomId) return

      try {
        const message = await prisma.message.create({
          data: { roomId, senderId: userId, content: content.trim() },
          include: { sender: { select: { username: true } } },
        })

        // Broadcast immediately (feels instant)
        io.to(roomId).emit('new_message', {
          id: message.id,
          content: message.content,
          senderName: message.sender.username,
          senderId: userId,
          createdAt: message.createdAt,
          modStatus: 'PENDING',
        })

        // Run AI moderation in background (non-blocking)
        moderateMessage(message.id, content, userId).then((result) => {
          if (result.shouldBlock) {
            io.to(roomId).emit('message_blocked', { messageId: message.id })
          } else {
            io.to(roomId).emit('message_moderated', {
              messageId: message.id,
              verdict: result.verdict,
              confidence: result.confidence,
            })
          }
        })
      } catch (err) {
        console.error('send_message error:', err)
      }
    })

    // ────────────────────────────────────────────────────────
    //  WEBRTC SIGNALING
    //  Server is just a relay — never touches actual video data
    // ────────────────────────────────────────────────────────
    socket.on('webrtc_offer', ({ roomId, offer }) => {
      socket.to(roomId).emit('webrtc_offer', { offer })
    })

    socket.on('webrtc_answer', ({ roomId, answer }) => {
      socket.to(roomId).emit('webrtc_answer', { answer })
    })

    socket.on('webrtc_ice_candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('webrtc_ice_candidate', { candidate })
    })

    // ────────────────────────────────────────────────────────
    //  TYPING INDICATORS
    // ────────────────────────────────────────────────────────
    socket.on('typing_start', ({ roomId }) => socket.to(roomId).emit('partner_typing'))
    socket.on('typing_stop',  ({ roomId }) => socket.to(roomId).emit('partner_stopped_typing'))

    // ────────────────────────────────────────────────────────
    //  NEXT STRANGER — skip to a new match
    // ────────────────────────────────────────────────────────
    socket.on('next_stranger', async ({ roomId }) => {
      await endRoom(roomId, io)
      socketRoomMap.delete(socket.id)
    })

    // ────────────────────────────────────────────────────────
    //  DEBATE VERDICT
    // ────────────────────────────────────────────────────────
    socket.on('request_verdict', async ({ roomId, topic }) => {
      try {
        const [messages, room] = await Promise.all([
          prisma.message.findMany({
            where: { roomId },
            include: { sender: { select: { username: true } } },
            orderBy: { createdAt: 'asc' },
          }),
          prisma.room.findUnique({
            where: { id: roomId },
            include: {
              user1: { select: { username: true } },
              user2: { select: { username: true } },
            },
          }),
        ])

        if (!room?.user2) return

        const verdict = await generateDebateVerdict(
          topic || 'General Debate',
          room.user1.username,
          room.user2.username,
          messages.map(m => ({ sender: m.sender.username, content: m.content }))
        )
        io.to(roomId).emit('debate_verdict', { verdict })
      } catch (err) {
        console.error('verdict error:', err)
      }
    })

    // ────────────────────────────────────────────────────────
    //  DISCONNECT
    // ────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ Disconnected: ${socket.data.username}`)
      const roomId = socketRoomMap.get(socket.id)
      if (roomId) await endRoom(roomId, io)
      socketRoomMap.delete(socket.id)
      await removeFromAllQueues(userId)
    })
  })
}

// ── Helper: close a room and notify the remaining user ────────
async function endRoom(roomId: string, io: Server) {
  try {
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'ENDED', endedAt: new Date() },
    })
    io.to(roomId).emit('partner_left', { message: 'Your partner has left the chat.' })
    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (room) {
      const ids = [room.user1Id, room.user2Id].filter(Boolean) as string[]
      await prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { totalChats: { increment: 1 } },
      })
    }
  } catch (err) {
    console.error('endRoom error:', err)
  }
}
