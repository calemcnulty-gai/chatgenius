import { db } from '@/db'
import { messages } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { MessageListClient } from '@/components/chat/MessageListClient'
import { Timestamp } from '@/types/timestamp'
import { User } from '@/types/user'

interface MessageData {
  id: string
  content: string
  sender: User
  createdAt: Timestamp
  updatedAt: Timestamp
  parentId: string | null
  replyCount: number
  latestReplyAt: Timestamp | undefined
  parentMessageId: string | null
}

interface MessageListServerProps {
  channelId: string
  variant: 'channel' | 'dm'
}

export async function MessageListServer({ channelId, variant }: MessageListServerProps) {
  // Fetch initial messages from the database
  const dbMessages = await db.query.messages.findMany({
    where: eq(messages.channelId, channelId),
    with: {
      sender: true,
    },
    orderBy: [asc(messages.createdAt)],
  })

  // Format messages to match the expected MessageData type
  const initialMessages: MessageData[] = dbMessages.map(msg => ({
    id: msg.id,
    content: msg.content,
    sender: {
      id: msg.sender.id,
      name: msg.sender.name,
      email: msg.sender.email,
      profileImage: msg.sender.profileImage,
      displayName: msg.sender.displayName,
      title: msg.sender.title,
      timeZone: msg.sender.timeZone,
      status: 'active',
      isAi: false,
      lastHeartbeat: null,
      createdAt: msg.sender.createdAt,
      updatedAt: msg.sender.updatedAt,
    },
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    parentId: msg.parentMessageId,
    replyCount: msg.replyCount ?? 0,
    latestReplyAt: msg.latestReplyAt || undefined,
    parentMessageId: msg.parentMessageId,
  }))

  return (
    <MessageListClient 
      channelId={channelId} 
      variant={variant} 
      initialMessages={initialMessages} 
    />
  )
} 