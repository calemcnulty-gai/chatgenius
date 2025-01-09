import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { name, displayName, title, timeZone, profileImage } = await request.json()

    // Update user in database
    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        displayName,
        title,
        timeZone,
        profileImage,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkUserId))
      .returning()

    if (!updatedUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 