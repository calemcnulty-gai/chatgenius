import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { channelMentions } from '@/db/schema'

export async function GET(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return new NextResponse('Workspace ID is required', { status: 400 })
    }

    // Get mention counts for all channels in the workspace
    const mentionCounts = await db.query.channelMentions.findMany({
      where: eq(channelMentions.userId, userId),
      with: {
        channel: {
          columns: {
            id: true,
            workspaceId: true,
          },
        },
      },
    })

    // Filter to only channels in the requested workspace and format response
    const workspaceMentionCounts = mentionCounts
      .filter(mention => mention.channel.workspaceId === workspaceId)
      .reduce((acc, mention) => {
        acc[mention.channelId] = mention.unreadCount
        return acc
      }, {} as Record<string, number>)

    return NextResponse.json({ counts: workspaceMentionCounts })
  } catch (error) {
    console.error('Error getting mention counts:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 