import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaces, workspaceMemberships } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// For development, we'll send all test emails to this address
const DEV_TEST_EMAIL = 'cale.mcnulty@gauntletai.com'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { email, workspaceId } = await req.json()
    if (!email || !workspaceId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Verify the user is a member of the workspace
    const membership = await db.query.workspaceMemberships.findFirst({
      where: and(
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(workspaceMemberships.userId, userId)
      ),
    })

    if (!membership) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get workspace details
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    })

    if (!workspace) {
      return new NextResponse('Workspace not found', { status: 404 })
    }

    // Generate invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite?workspace=${workspaceId}&email=${encodeURIComponent(email)}`

    console.log('Sending invite email with Resend:', {
      to: DEV_TEST_EMAIL, // In development, always send to verified email
      actualRecipient: email,
      workspaceName: workspace.name,
      inviteLink,
      apiKey: process.env.RESEND_API_KEY?.slice(0, 8) + '...',
    })

    try {
      // Send invite email using Resend's sandbox domain
      const result = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: DEV_TEST_EMAIL, // In development, always send to verified email
        subject: `[TEST] Invite for ${email} to join ${workspace.name} on ChatGenius`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f3f4f6; padding: 12px; margin-bottom: 24px; border-radius: 6px;">
              <p style="color: #4b5563; margin: 0;">⚠️ Development Mode: This invite was intended for <strong>${email}</strong></p>
            </div>
            <h1 style="color: #1a1a1a;">You've been invited to join ${workspace.name}</h1>
            <p style="color: #4a4a4a;">You've been invited to join the ${workspace.name} workspace on ChatGenius. Click the button below to accept the invitation:</p>
            <a href="${inviteLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
            <p style="color: #6b7280; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
      })

      console.log('Resend email result:', result)
      return NextResponse.json({ 
        message: 'Invite sent successfully',
        note: 'In development mode, the invite was sent to your verified email address'
      })
    } catch (emailError) {
      console.error('Resend email error:', emailError)
      return new NextResponse(
        JSON.stringify({ message: 'Failed to send invite email', error: emailError }),
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in invite endpoint:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 