import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { getOrCreateUser } from '@/lib/db/users'

// Force Node.js runtime
export const runtime = 'nodejs'

export async function POST() {
  console.log('🔍 Sync route called')
  try {
    console.log('🔑 Getting auth...')
    const authResult = auth()
    console.log('📦 Auth result:', authResult)
    
    const { userId } = authResult
    console.log('👤 UserId from auth:', userId)

    if (!userId) {
      console.log('❌ No userId found in auth result')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('🔎 Getting current user...')
    const user = await currentUser()
    console.log('📦 Current user result:', JSON.stringify(user, null, 2))

    if (!user) {
      console.log('❌ No user found from currentUser()')
      return new NextResponse('User not found', { status: 404 })
    }

    console.log('💾 Calling getOrCreateUser with params:', {
      id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddresses: user.emailAddresses,
      imageUrl: user.imageUrl,
    })

    // Get or create user in our database
    const dbUser = await getOrCreateUser({
      id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddresses: user.emailAddresses,
      imageUrl: user.imageUrl,
    })

    console.log('✅ DB User result:', dbUser)

    // Return the user with the internal database ID as the id field
    return NextResponse.json({
      ...dbUser,
      id: dbUser.id,
    })
  } catch (error) {
    console.error('🚨 Error in sync route:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available')
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 