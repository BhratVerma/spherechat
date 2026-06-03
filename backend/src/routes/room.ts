import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET /api/room/:roomId
router.get('/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.userId!

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        user1: { select: { id: true, username: true, trustScore: true } },
        user2: { select: { id: true, username: true, trustScore: true } },
        messages: {
          include: { sender: { select: { username: true } } },
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    })

    if (!room) return res.status(404).json({ error: 'Room not found' })
    if (room.user1Id !== userId && room.user2Id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({ room })
  } catch (err) {
    console.error('get room error:', err)
    res.status(500).json({ error: 'Failed to fetch room' })
  }
})

// POST /api/room/:roomId/rate  — rate the other user after chat
router.post('/:roomId/rate', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.userId!
    const { score, comment } = req.body

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be 1–5' })
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) return res.status(404).json({ error: 'Room not found' })

    const ratedId = room.user1Id === userId ? room.user2Id : room.user1Id
    if (!ratedId) return res.status(400).json({ error: 'No partner to rate' })

    await prisma.rating.create({
      data: { roomId, raterId: userId, ratedId, score, comment },
    })

    // Recalculate trust score
    const ratings = await prisma.rating.findMany({ where: { ratedId }, select: { score: true } })
    const avg = ratings.reduce((s, r) => s + r.score, 0) / ratings.length
    await prisma.user.update({ where: { id: ratedId }, data: { trustScore: (avg / 5) * 100 } })

    res.json({ success: true })
  } catch (err) {
    console.error('rate error:', err)
    res.status(500).json({ error: 'Failed to submit rating' })
  }
})

// POST /api/room/:roomId/save-friend
router.post('/:roomId/save-friend', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.userId!

    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) return res.status(404).json({ error: 'Room not found' })

    const targetId = room.user1Id === userId ? room.user2Id : room.user1Id
    if (!targetId) return res.status(400).json({ error: 'No partner found' })

    await prisma.friend.upsert({
      where: { userId_targetId: { userId, targetId } },
      create: { userId, targetId },
      update: {},
    })

    res.json({ success: true, message: 'Friend saved!' })
  } catch (err) {
    console.error('save friend error:', err)
    res.status(500).json({ error: 'Failed to save friend' })
  }
})

export default router
