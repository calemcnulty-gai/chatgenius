import { db } from '@/db'
import { channels, directMessageChannels, users, userAuth } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { User as DBUser } from '@/types/user'

export async function validateAndGetUser(userId: string): Promise<DBUser | null> {
  const result = await db.query.userAuth.findFirst({
    where: eq(userAuth.userId, userId),
    with: {
      user: true
    }
  })

  if (!result?.user) return null

  const status = result.user.status as DBUser['status']
  return {
    ...result.user,
    status: status || 'offline',
    lastHeartbeat: result.user.lastHeartbeat,
    userAuth: [result],
  }
}

export async function validateAndGetChannel(channelId: string) {
  // Check if this is a regular channel or DM channel
  const regularChannel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
    with: {
      workspace: true,
    },
  })

  if (regularChannel) return { type: 'regular' as const, channel: regularChannel }

  // Get DM channel with all required fields
  const dmChannel = await db.query.directMessageChannels.findFirst({
    where: eq(directMessageChannels.id, channelId),
    with: {
      members: {
        with: {
          user: true,
        },
      },
    },
  })

  if (dmChannel) return { type: 'dm' as const, channel: dmChannel }

  throw new Error('Channel not found')
}

export async function validateAndGetAIUser(name: string) {
  const aiUser = await db.query.users.findFirst({
    where: eq(users.name, name)
  })

  if (!aiUser) throw new Error('AI user not found')
  return aiUser
} 