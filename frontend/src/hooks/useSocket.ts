import { useEffect, useRef, useState, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import type { Message, PartnerInfo, RoomMode } from '@/types'

interface Options {
  mode: RoomMode
  interests: string[]
  preferredLang: string
  onMatchFound?: (roomId: string, mode: RoomMode, isInitiator: boolean) => void
  onPartnerInfo?: (p: PartnerInfo) => void
  onPartnerLeft?: () => void
}

export function useSocket(opts: Options) {
  const [isQueued, setIsQueued]         = useState(false)
  const [messages, setMessages]         = useState<Message[]>([])
  const [isPartnerTyping, setTyping]    = useState(false)
  const [debateVerdict, setVerdict]     = useState<string | null>(null)
  const [roomId, setRoomId]             = useState<string | null>(null)
  const socket = useRef(getSocket())

  useEffect(() => {
    const s = socket.current

    function joinQueue() {
      s.emit('join_queue', {
        mode: opts.mode,
        interests: opts.interests,
        preferredLang: opts.preferredLang,
      })
    }

    s.on('connect',    joinQueue)
    s.on('queued',     () => setIsQueued(true))

    s.on('match_found', ({ roomId, mode, isInitiator }) => {
      setIsQueued(false)
      setRoomId(roomId)
      opts.onMatchFound?.(roomId, mode, isInitiator)
    })

    s.on('partner_info',            ({ partner }) => opts.onPartnerInfo?.(partner))
    s.on('partner_left',            ()            => opts.onPartnerLeft?.())
    s.on('partner_typing',          ()            => setTyping(true))
    s.on('partner_stopped_typing',  ()            => setTyping(false))
    s.on('debate_verdict',          ({ verdict }) => setVerdict(verdict))

    s.on('new_message', (msg: Message) => setMessages(p => [...p, msg]))

    s.on('message_blocked', ({ messageId }) => {
      setMessages(p => p.map(m => m.id === messageId
        ? { ...m, isBlocked: true, content: '[Message removed by AI moderation]' }
        : m
      ))
    })

    s.on('message_moderated', ({ messageId, verdict, confidence }) => {
      setMessages(p => p.map(m => m.id === messageId
        ? { ...m, modVerdict: verdict, modConfidence: confidence }
        : m
      ))
    })

    s.on('message_translated', ({ messageId, translated }) => {
      setMessages(p => p.map(m => m.id === messageId ? { ...m, translated } : m))
    })

    // If already connected, join queue immediately
    if (s.connected) joinQueue()

    return () => {
      s.off('connect'); s.off('queued'); s.off('match_found'); s.off('partner_info')
      s.off('partner_left'); s.off('partner_typing'); s.off('partner_stopped_typing')
      s.off('debate_verdict'); s.off('new_message'); s.off('message_blocked')
      s.off('message_moderated'); s.off('message_translated')
    }
  }, [])

  const sendMessage = useCallback((content: string) => {
    if (!roomId || !content.trim()) return
    socket.current.emit('send_message', { roomId, content })
  }, [roomId])

  const sendTypingStart = useCallback(() => {
    if (roomId) socket.current.emit('typing_start', { roomId })
  }, [roomId])

  const sendTypingStop = useCallback(() => {
    if (roomId) socket.current.emit('typing_stop', { roomId })
  }, [roomId])

  const nextStranger = useCallback(() => {
    if (!roomId) return
    socket.current.emit('next_stranger', { roomId })
    setMessages([])
    setRoomId(null)
    setIsQueued(true)
    socket.current.emit('join_queue', { mode: opts.mode, interests: opts.interests, preferredLang: opts.preferredLang })
  }, [roomId])

  const requestVerdict = useCallback((topic: string) => {
    if (roomId) socket.current.emit('request_verdict', { roomId, topic })
  }, [roomId])

  return {
    isQueued, roomId, messages, isPartnerTyping, debateVerdict,
    sendMessage, sendTypingStart, sendTypingStop, nextStranger, requestVerdict,
    socket: socket.current,
  }
}
