import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

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
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent

  // Verify the webhook
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

  // Handle the webhook
  const eventType = evt.type;
  console.log('Received webhook event:', eventType);

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, first_name, last_name, image_url, username, email_addresses } = evt.data;

    console.log('User data from Clerk:', {
      id,
      first_name,
      last_name,
      image_url,
      username,
      email_addresses
    });

    const name = first_name && last_name 
      ? `${first_name} ${last_name}`.trim()
      : username || 'Anonymous'

    const primaryEmail = email_addresses?.find(email => email.id === evt.data.primary_email_address_id)
    const email = primaryEmail?.email_address

    console.log('Processed user data:', { id, name, email });

    if (!email) {
      console.error('No email found for user:', id)
      return new Response('Email required', { status: 400 })
    }

    // Upsert user
    await db
      .insert(users)
      .values({
        id,
        name,
        email,
        profileImage: image_url,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name,
          email,
          profileImage: image_url,
          updatedAt: new Date(),
        },
      });

    console.log('User data synced successfully');
  }

  return new Response('', { status: 200 })
} 