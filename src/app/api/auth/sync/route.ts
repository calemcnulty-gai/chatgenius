import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { getOrCreateUser } from '@/lib/db/users'

// Force Node.js runtime
export const runtime = 'nodejs'

export async function POST() {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await currentUser()

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Get or create user in our database
    const dbUser = await getOrCreateUser({
      id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddresses: user.emailAddresses,
      imageUrl: user.imageUrl,
    })

    // Return the user with the internal database ID as the id field
    return NextResponse.json({
      ...dbUser,
      id: dbUser.id,
    })
  } catch (error) {
    console.error('Error in sync route:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 