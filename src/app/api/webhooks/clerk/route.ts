import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/db'
import { users } from '@/db/schema'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.WEBHOOK_SECRET || '');

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with ID ${id} and type ${eventType}`)
  console.log('Webhook body:', body)

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, first_name, last_name, image_url } = evt.data

    const name = [first_name, last_name].filter(Boolean).join(' ')

    // Upsert user
    await db
      .insert(users)
      .values({
        id,
        name,
        profileImage: image_url,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name,
          profileImage: image_url,
          updatedAt: new Date(),
        },
      })
  }

  return new Response('', { status: 200 })
} 