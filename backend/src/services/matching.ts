// In-memory matchmaking queue — no Redis needed for development

export interface QueueEntry {
  userId: string
  socketId: string
  mode: string
  interests: string[]
  preferredLang: string
  joinedAt: number
}

const queues = new Map<string, Map<string, QueueEntry>>()

function getQueue(mode: string): Map<string, QueueEntry> {
  if (!queues.has(mode)) queues.set(mode, new Map())
  return queues.get(mode)!
}

export async function addToQueue(entry: QueueEntry): Promise<void> {
  getQueue(entry.mode).set(entry.userId, entry)
  console.log(`📋 Queue [${entry.mode}]: ${getQueue(entry.mode).size} user(s) waiting`)
}

export async function removeFromQueue(
  userId: string,
  mode: string
): Promise<void> {
  getQueue(mode).delete(userId)
}

export async function removeFromAllQueues(userId: string): Promise<void> {
  for (const mode of ['TALK', 'DEBATE', 'LANGUAGE', 'GAME']) {
    getQueue(mode).delete(userId)
  }
}

export async function findMatch(
  seeker: QueueEntry
): Promise<QueueEntry | null> {
  const queue = getQueue(seeker.mode)
  let best: QueueEntry | null = null
  let bestScore = -1

  for (const [uid, candidate] of queue.entries()) {
    if (uid === seeker.userId) continue
    const score = scoreMatch(seeker, candidate)
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }

  return best
}

function scoreMatch(a: QueueEntry, b: QueueEntry): number {
  let score = 10
  const shared = a.interests.filter(i => b.interests.includes(i))
  score += shared.length * 15
  if (a.preferredLang === b.preferredLang) score += 20
  const waitSec = (Date.now() - b.joinedAt) / 1000
  score += Math.min(waitSec / 5, 25)
  return score
}