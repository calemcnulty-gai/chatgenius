import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { getOrCreateUser } from '@/lib/db/users'

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
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddresses: user.emailAddresses,
      imageUrl: user.imageUrl,
    })

    return NextResponse.json(dbUser)
  } catch (error) {
    console.error('Error syncing user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 