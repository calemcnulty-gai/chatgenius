import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createOrUpdateUser } from '../queries'
import type { ClerkWebhookUser } from '../types'

export async function verifyWebhook(
  body: string,
  headers: Record<string, string>
): Promise<WebhookEvent> {
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')
  return wh.verify(body, headers) as WebhookEvent
}

function isUserEvent(type: string): boolean {
  return type === 'user.created' || type === 'user.updated'
}

function isUserData(data: any): data is ClerkWebhookUser {
  return (
    data &&
    typeof data.id === 'string' &&
    Array.isArray(data.email_addresses) &&
    data.email_addresses.length > 0 &&
    typeof data.email_addresses[0].email_address === 'string'
  )
}

export async function handleUserEvent(
  eventType: string,
  eventData: unknown
): Promise<void> {
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

  await createOrUpdateUser({
    clerkId: eventData.id,
    name,
    email,
    profileImage: eventData.image_url,
  })
} 