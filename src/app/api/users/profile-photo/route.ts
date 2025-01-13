import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { put } from '@vercel/blob'
import { now } from '@/types/timestamp'

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return new NextResponse('No file provided', { status: 400 })
    }

    // Upload to Vercel Blob
    const { url } = await put(file.name, file, {
      access: 'public',
    })

    // Update user's profile image
    await db
      .update(users)
      .set({
        profileImage: url,
        updatedAt: now(),
      })
      .where(eq(users.clerkId, userId))

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Remove profile image URL from user
    await db
      .update(users)
      .set({
        profileImage: null,
        updatedAt: now(),
      })
      .where(eq(users.clerkId, userId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing profile photo:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 