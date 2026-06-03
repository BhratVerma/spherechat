export interface User {
  id: string
  username: string
  phone: string
  interests: string[]
  trustScore: number
  totalChats: number
  isBanned: boolean
}

export interface Message {
  id: string
  content: string
  senderName: string
  senderId: string
  createdAt: string | Date
  modStatus: 'PENDING' | 'SAFE' | 'WARNING' | 'TOXIC'
  modVerdict?: 'safe' | 'warning' | 'toxic'
  modConfidence?: number
  translated?: string
  isBlocked?: boolean
}

export interface PartnerInfo {
  username: string
  trustScore: number
  interests: string[]
}

export type RoomMode = 'TALK' | 'DEBATE' | 'LANGUAGE' | 'GAME'
