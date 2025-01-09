import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { displayName, title, timeZone } = await request.json()

    const updatedUser = await db
      .update(users)
      .set({
        displayName,
        title,
        timeZone
      })
      .where(eq(users.clerkId, userId))
      .returning()

    return NextResponse.json(updatedUser[0])
  } catch (error) {
    console.error('Error updating user profile:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 