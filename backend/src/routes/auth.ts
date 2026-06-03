import { Router, Request, Response } from 'express'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { sendOTP, verifyOTP, isVerified, markVerified } from '../services/otp'

const router = Router()
const prisma = new PrismaClient()

const sendSchema = z.object({
  phone: z.string().min(10).max(15),
})

const verifySchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
  username: z.string().min(3).max(20).optional(),
  interests: z.array(z.string()).optional(),
})

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = sendSchema.parse(req.body)
    await sendOTP(phone)
    res.json({ success: true, message: 'OTP sent.' })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid phone number format. Use: +919876543210' })
    }
    console.error('send-otp error:', err)
    res.status(500).json({ error: 'Failed to send OTP' })
  }
})

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, code, username, interests } = verifySchema.parse(req.body)

    // If this is profile completion step, skip re-verifying OTP
    const alreadyVerified = isVerified(phone)

    if (!alreadyVerified) {
      const valid = await verifyOTP(phone, code)
      if (!valid) {
        return res.status(400).json({ error: 'Invalid or expired code. Try again.' })
      }
      markVerified(phone)
    }

    let user = await prisma.user.findUnique({ where: { phone } })

    if (!user) {
      // New user — need username and interests
      if (!username) {
        return res.status(400).json({
          error: 'New account. Provide a username.',
          isNewUser: true,
        })
      }

      const taken = await prisma.user.findUnique({ where: { username } })
      if (taken) {
        return res.status(400).json({ error: 'Username already taken. Choose another.' })
      }

      user = await prisma.user.create({
        data: {
          phone,
          username,
          interests: interests || [],
        },
      })
    }

    // Clear verified state after account is created or found
    markVerified(phone, false)

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    )

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        interests: user.interests,
        trustScore: user.trustScore,
        totalChats: user.totalChats,
        isBanned: user.isBanned,
      },
    })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' })
    }
    console.error('verify-otp error:', err)
    res.status(500).json({ error: 'Verification failed. Please try again.' })
  }
})

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token provided' })

    const { userId } = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { userId: string }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        phone: true,
        interests: true,
        trustScore: true,
        totalChats: true,
        isBanned: true,
      },
    })

    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ user })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router