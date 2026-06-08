import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { initializeSocket } from './socket'
import authRoutes from './routes/auth'
import roomRoutes from './routes/room'
import { authMiddleware } from './middleware/auth'

dotenv.config()

const app = express()
const httpServer = createServer(app)

// Required for Railway/Vercel proxy
app.set('trust proxy', 1)

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://spherechat-kappa.vercel.app',
  process.env.FRONTEND_URL || 'http://localhost:3000',
]

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}))

app.use(express.json())

app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))
app.use('/api/auth/send-otp', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP requests. Try again in an hour.' },
}))

app.use('/api/auth', authRoutes)
app.use('/api/room', authMiddleware, roomRoutes)

app.get('/health', (_, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

initializeSocket(io)

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗')
  console.log(`║  SphereChat Backend — port ${PORT}      ║`)
  console.log('╚══════════════════════════════════════╝')
  console.log(`🌐  http://localhost:${PORT}`)
  console.log(`⚡  Socket.io ready`)
  console.log(`🔗  Frontend: ${process.env.FRONTEND_URL}\n`)
})

export { io }