import Groq from 'groq-sdk'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export interface ModerationResult {
  verdict: 'safe' | 'warning' | 'toxic'
  confidence: number
  reason: string
  shouldBlock: boolean
}

const safeFallback = (): ModerationResult => ({
  verdict: 'safe',
  confidence: 1,
  reason: 'moderation skipped',
  shouldBlock: false,
})

function isGroqConfigured(): boolean {
  return !!(
    process.env.GROQ_API_KEY &&
    !process.env.GROQ_API_KEY.startsWith('gsk_xxx')
  )
}

export async function moderateMessage(
  messageId: string,
  content: string,
  userId: string
): Promise<ModerationResult> {
  if (!isGroqConfigured()) return safeFallback()

  try {
    const response = await client.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: `You are a content moderation AI. Analyze the message and respond ONLY with valid JSON, no extra text:
{"verdict":"safe","confidence":0.95,"reason":"normal conversation","shouldBlock":false}

Rules:
- safe = normal chat, debate, opinions, strong language
- warning = mildly offensive or inappropriate  
- toxic = hate speech, sexual content, threats, harassment
- shouldBlock = true only if toxic`,
        },
        {
          role: 'user',
          content: `Moderate this message: "${content}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
    })

    const text = response.choices[0]?.message?.content?.trim() || ''
    const result: ModerationResult = JSON.parse(text)
    console.log(`🛡 Moderation [${result.verdict}]: "${content}"`)
    return result
  } catch (err) {
    console.error('Moderation error:', err)
    return safeFallback()
  }
}

export async function generateDebateVerdict(
  topic: string,
  user1Name: string,
  user2Name: string,
  transcript: Array<{ sender: string; content: string }>
): Promise<string> {
  if (!isGroqConfigured()) {
    return '⚠️ Add your GROQ_API_KEY to enable AI verdicts.'
  }

  try {
    const transcriptText = transcript
      .map(m => `${m.sender}: ${m.content}`)
      .join('\n')

    const response = await client.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'user',
          content: `You are a neutral debate judge.

Topic: "${topic}"
Debaters: ${user1Name} vs ${user2Name}

Transcript:
${transcriptText}

Give a fair verdict covering:
1. Who argued better and why (2 sentences)
2. One key flaw for each debater
3. Final winner or "Draw"

Keep it under 120 words. Be fair and specific.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    return (
      response.choices[0]?.message?.content ||
      'Could not generate verdict.'
    )
  } catch (err) {
    console.error('Verdict error:', err)
    return 'Error generating verdict. Please try again.'
  }
}

export async function translateMessage(
  content: string,
  targetLang: string
): Promise<string> {
  if (!isGroqConfigured()) return content

  try {
    const response = await client.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'user',
          content: `Translate to ${targetLang}. Return ONLY the translated text, nothing else: "${content}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    })

    return response.choices[0]?.message?.content || content
  } catch {
    return content
  }
}