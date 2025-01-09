import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaces, workspaceMemberships, invites } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { Resend } from 'resend'
import { getOrCreateUser } from '@/lib/db/users'
import { getAuth } from '@clerk/nextjs/server'

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  console.log('Starting invite process...')
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      console.log('No auth found')
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      console.log('No user found')
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
    }
    console.log('Authenticated user:', clerkUser.id)

    // Get or create user to get their database ID
    const user = await getOrCreateUser({
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      emailAddresses: clerkUser.emailAddresses,
      imageUrl: clerkUser.imageUrl,
    })

    const { email, workspaceId } = await req.json()
    console.log('Request data:', { email, workspaceId })

    if (!email || !workspaceId) {
      console.log('Missing required fields')
      return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 })
    }

    const token = uuidv4()
    const invite = await db.insert(invites).values({
      email,
      workspaceId,
      inviterId: user.id,
      token,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }).returning().execute()
    console.log('Created invite:', invite)

    // Get workspace name
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    })

    try {
      // In development, send test email to verified email
      const testEmail = process.env.NODE_ENV === 'development' ? 'cale.mcnulty@gauntletai.com' : email
      
      const data = await resend.emails.send({
        from: 'ChatGenius <onboarding@resend.dev>',
        to: testEmail,
        subject: `[TEST] Invite for ${email} to join ${workspace?.name || 'Main'} on ChatGenius`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${process.env.NODE_ENV === 'development' ? 
              `<div style="background: #f8f9fa; padding: 12px; margin-bottom: 24px; border-radius: 4px;">
                ⚠️ Development Mode: This invite was intended for ${email}
              </div>` : ''
            }
            
            <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 24px;">You've been invited to join ${workspace?.name || 'Main'}</h1>
            
            <p style="color: #4a5568; margin-bottom: 32px;">
              You've been invited to join the ${workspace?.name || 'Main'} workspace on ChatGenius. Click the button below to accept the invitation:
            </p>

            <a href="${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite[0].id}" 
               style="display: inline-block; background: #3182ce; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: 500;">
              Accept Invitation
            </a>

            <p style="color: #718096; margin-top: 32px; font-size: 14px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        `,
      })
      console.log('Email sent:', data)
    } catch (error) {
      console.error('Failed to send email:', error)
      // Don't return error to client, just log it
    }

    return NextResponse.json(invite[0])
  } catch (error) {
    console.error('Error in invite process:', error)
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 })
  }
} 