import { pusherServer } from '@/lib/pusher'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export async function POST() {
  console.log('Terminate-all endpoint called')
  try {
    const { userId } = auth()
    if (!userId) {
      console.log('No user ID found, returning unauthorized')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('Attempting to terminate all app connections via Admin API')
    
    try {
      // Use the Admin API directly
      const appId = process.env.PUSHER_APP_ID!
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY!
      const secret = process.env.PUSHER_SECRET!
      
      const timestamp = Math.floor(Date.now() / 1000)
      const method = 'DELETE'
      const path = `/apps/${appId}/channels`
      
      // Create signature
      const signatureString = `${method}\n${path}\nauth_key=${key}&auth_timestamp=${timestamp}&auth_version=1.0`
      const crypto = require('crypto')
      const signature = crypto
        .createHmac('sha256', secret)
        .update(signatureString)
        .digest('hex')
      
      // Make the request to Pusher's Admin API
      const response = await fetch(`https://api-${process.env.NEXT_PUBLIC_PUSHER_CLUSTER}.pusher.com${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Pusher-Key': key,
          'X-Pusher-Signature': signature,
          'X-Pusher-Timestamp': timestamp.toString(),
        },
      })
      
      if (!response.ok) {
        const error = await response.text()
        console.error('Pusher Admin API error:', error)
        throw new Error(`Pusher Admin API returned ${response.status}: ${error}`)
      }
      
      console.log('Successfully called Pusher Admin API to terminate all connections')
    } catch (pusherError) {
      console.error('Pusher termination error:', pusherError)
      throw pusherError
    }

    return NextResponse.json({ message: 'All app connections terminated' })
  } catch (error) {
    console.error('Error in terminate-all endpoint:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 