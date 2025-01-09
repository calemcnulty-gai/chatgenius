import { NextResponse } from 'next/server'
import { db } from '@/db'
import { invites, workspaces } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the invite details
    const invite = await db.query.invites.findFirst({
      where: eq(invites.id, params.id),
    })

    if (!invite) {
      return new NextResponse('Invite not found', { status: 404 })
    }

    // Check if invite is expired
    if (new Date() > new Date(invite.expiresAt)) {
      return new NextResponse('Invite has expired', { status: 410 })
    }

    // Check if invite is already used
    if (invite.status !== 'pending') {
      return new NextResponse('Invite has already been used', { status: 410 })
    }

    // Get workspace details separately
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, invite.workspaceId),
    })

    return NextResponse.json({ ...invite, workspace })
  } catch (error) {
    console.error('Error fetching invite:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 