import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  const { userId } = auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // Fetch AI users (those with clerk_id starting with 'ai-')
    const { rows: aiUsers } = await db.execute(sql`
      SELECT id, clerk_id, name, display_name, profile_image, title
      FROM users 
      WHERE clerk_id LIKE 'ai-%'
      ORDER BY name ASC;
    `)

    return NextResponse.json(aiUsers)
  } catch (error) {
    console.error('Failed to fetch AI users:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 