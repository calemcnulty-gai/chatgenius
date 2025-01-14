import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { getOrCreateUser } from '@/lib/db/users'
import { headers } from 'next/headers'

// Force Node.js runtime
export const runtime = 'nodejs'

const log = (...args: any[]) => {
  process.stdout.write(args.map(arg => 
    typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
  ).join(' ') + '\n')
}

export async function POST() {
  log('\n🔍 Sync route called')
  try {
    const headersList = headers()
    log('📨 Request headers:', Object.fromEntries(headersList.entries()))

    log('🔑 Getting auth...')
    const authResult = auth()
    log('📦 Auth result:', authResult)
    
    const { userId } = authResult
    log('👤 UserId from auth:', userId)

    if (!userId) {
      log('❌ No userId found in auth result')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    log('🔎 Getting current user...')
    const user = await currentUser()
    log('📦 Current user result:', JSON.stringify(user, null, 2))

    if (!user) {
      log('❌ No user found from currentUser()')
      return new NextResponse('User not found', { status: 404 })
    }

    log('💾 Calling getOrCreateUser with params:', {
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

    log('✅ DB User result:', dbUser)

    // Return the user with the internal database ID as the id field
    return NextResponse.json({
      ...dbUser,
      id: dbUser.id,
    })
  } catch (error) {
    log('🚨 Error in sync route:', error)
    log('Error stack:', error instanceof Error ? error.stack : 'No stack trace available')
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 