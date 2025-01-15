import { db } from '@/db'
import { channels } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import type { Channel, ChannelType } from './types'

export async function getChannelsByWorkspaceId(workspaceId: string): Promise<Channel[]> {
  return await db.query.channels.findMany({
    where: eq(channels.workspaceId, workspaceId),
  })
}

export async function getChannelBySlug(
  workspaceId: string,
  slug: string
): Promise<Channel | undefined> {
  return await db.query.channels.findFirst({
    where: eq(channels.slug, slug),
  })
}

export async function createChannel(params: {
  workspaceId: string
  name: string
  slug: string
  type: ChannelType
}): Promise<Channel> {
  const [channel] = await db
    .insert(channels)
    .values({
      id: uuidv4(),
      workspaceId: params.workspaceId,
      name: params.name,
      slug: params.slug,
      type: params.type,
    })
    .returning()

  return channel
} 