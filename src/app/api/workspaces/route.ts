import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaces, workspaceMemberships } from '@/db/schema'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { name, description } = await req.json()

    const workspaceId = uuidv4()
    
    // Create workspace
    await db.insert(workspaces).values({
      id: workspaceId,
      name,
      description,
      ownerId: userId,
    })

    // Add creator as admin member
    await db.insert(workspaceMemberships).values({
      id: uuidv4(),
      workspaceId,
      userId,
      role: 'admin',
    })

    return NextResponse.json({ id: workspaceId })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 