import { headers } from 'next/headers'
import { verifyWebhook, handleUserEvent } from '@/lib/auth/webhooks/clerk'

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
    const evt = await verifyWebhook(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    })

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