import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { channels, workspaceMemberships } from '@/db/schema'
import { v4 as uuidv4 } from 'uuid'
import { and, eq } from 'drizzle-orm'
import { generateSlug } from '@/lib/utils'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { workspaceId, name, type } = await req.json()

    // Validate input
    if (!workspaceId || !name || !type) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Check if user is a member of the workspace
    const membership = await db.query.workspaceMemberships.findFirst({
      where: and(
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(workspaceMemberships.userId, userId)
      ),
    })

    if (!membership) {
      return new NextResponse('Not a member of workspace', { status: 403 })
    }

    // Create channel
    const channelId = uuidv4()
    const slug = generateSlug(name)
    await db.insert(channels).values({
      id: channelId,
      workspaceId,
      name,
      slug,
      type,
    })

    const channel = await db.query.channels.findFirst({
      where: eq(channels.id, channelId),
    })

    return NextResponse.json({
      ...channel,
      slug: channel?.slug
    })
  } catch (error) {
    console.error('Error creating channel:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 