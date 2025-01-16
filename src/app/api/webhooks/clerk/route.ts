import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/db'
import { users, userAuth } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { now } from '@/types/timestamp'

interface WebhookUser {
  id: string
  first_name: string | null
  last_name: string | null
  image_url: string | null
  email_addresses: Array<{ email_address: string }>
}

function isUserEvent(type: string): boolean {
  return type === 'user.created' || type === 'user.updated'
}

function isUserData(data: any): data is WebhookUser {
  return (
    data &&
    typeof data.id === 'string' &&
    Array.isArray(data.email_addresses) &&
    data.email_addresses.length > 0 &&
    typeof data.email_addresses[0].email_address === 'string'
  )
}

async function handleUserEvent(eventType: string, eventData: unknown): Promise<void> {
  // Only handle user events
  if (!isUserEvent(eventType)) {
    return
  }

  // Type check the event data
  if (!isUserData(eventData)) {
    console.error('Invalid user data in webhook:', eventData)
    return
  }

  const name = [eventData.first_name, eventData.last_name].filter(Boolean).join(' ')
  const email = eventData.email_addresses[0].email_address
  const timestamp = now()

  // First create/update the user
  const [user] = await db
    .insert(users)
    .values({
      id: uuidv4(),
      name,
      email,
      profileImage: eventData.image_url,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name,
        profileImage: eventData.image_url,
        updatedAt: timestamp,
      },
    })
    .returning()

  // Then create/update the auth mapping
  await db
    .insert(userAuth)
    .values({
      id: uuidv4(),
      userId: user.id,
      clerkId: eventData.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: userAuth.clerkId,
      set: {
        updatedAt: timestamp,
      },
    })
}

export async function POST(req: Request) {
  try {
    // Get the headers
    const headerPayload = headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Missing svix headers', { status: 400 })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Verify the webhook
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')
    const evt = await wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent

    // Get the ID and type
    const { id } = evt.data
    const eventType = evt.type

    console.log(`Webhook with ID ${id} and type ${eventType}`)
    console.log('Webhook body:', body)

    // Handle the event
    await handleUserEvent(eventType, evt.data)

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Error processing webhook:', err)
    return new Response('Error occurred', { status: 400 })
  }
} 