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

// Trust Railway proxy
app.set('trust proxy', 1)

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))

app.use(cors({
  origin: true,
  credentials: true,
}))

app.use(express.json())

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}))

app.use('/api/auth/send-otp', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
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