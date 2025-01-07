import { pusherServer } from '@/lib/pusher'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST() {
  console.log('Terminate-all endpoint called')
  try {
    const { userId } = auth()
    if (!userId) {
      console.log('No user ID found, returning unauthorized')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('Attempting to terminate all app connections via REST API')
    
    try {
      // Use the REST API directly
      const appId = process.env.PUSHER_APP_ID!
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY!
      const secret = process.env.PUSHER_SECRET!
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
      
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const method = 'POST'
      const path = `/apps/${appId}/events`
      
      // Create query string with sorted parameters
      const queryParams = [
        ['auth_key', key],
        ['auth_timestamp', timestamp],
        ['auth_version', '1.0'],
        ['channels', JSON.stringify(['*'])],
        ['data', '{}'],
        ['name', 'pusher:kill']
      ]
      
      const queryString = queryParams
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')

      // Create signature
      const signatureString = [method, path, queryString].join('\n')
      const signature = crypto
        .createHmac('sha256', secret)
        .update(signatureString)
        .digest('hex')

      // Make the request to Pusher's REST API
      const url = `https://api-${cluster}.pusher.com${path}?${queryString}&auth_signature=${signature}`
      console.log('Making request to:', url)
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const error = await response.text()
        console.error('Pusher REST API error:', error)
        throw new Error(`Pusher REST API returned ${response.status}: ${error}`)
      }
      
      const result = await response.json()
      console.log('Successfully called Pusher REST API:', result)
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