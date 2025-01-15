import { Resend } from 'resend'
import {
  createInvite,
  findInviteByToken,
  findInviteByEmailAndWorkspace,
  isWorkspaceMember,
  acceptInvite as acceptInviteQuery
} from '../queries'
import type {
  CreateInviteParams,
  AcceptInviteParams,
  InviteResponse,
  AcceptInviteResponse
} from '../types'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendInvite(params: CreateInviteParams): Promise<InviteResponse> {
  try {
    // Check if user is already invited
    const existingInvite = await findInviteByEmailAndWorkspace(
      params.email,
      params.workspaceId
    )
    if (existingInvite) {
      return {
        invite: null,
        error: {
          message: 'User already invited',
          code: 'INVALID_INPUT'
        }
      }
    }

    // Check if user is already a member
    const isMember = await isWorkspaceMember(params.inviterId, params.workspaceId)
    if (!isMember) {
      return {
        invite: null,
        error: {
          message: 'Not authorized to invite to this workspace',
          code: 'UNAUTHORIZED'
        }
      }
    }

    const invite = await createInvite(params)

    // Send invite email
    await resend.emails.send({
      from: 'ChatGenius <noreply@chatgenius.xyz>',
      to: params.email,
      subject: 'You\'ve been invited to ChatGenius',
      html: `<p>Click <a href="${process.env.NEXT_PUBLIC_APP_URL}/invites/${invite.token}">here</a> to accept the invitation.</p>`
    })

    return { invite }
  } catch (error) {
    console.error('Error sending invite:', error)
    return {
      invite: null,
      error: {
        message: 'Failed to send invite',
        code: 'INVALID_INPUT'
      }
    }
  }
}

export async function acceptInvite(params: AcceptInviteParams): Promise<AcceptInviteResponse> {
  try {
    const invite = await findInviteByToken(params.token)
    if (!invite) {
      return {
        success: false,
        error: {
          message: 'Invalid or expired invite',
          code: 'NOT_FOUND'
        }
      }
    }

    const isMember = await isWorkspaceMember(params.userId, invite.workspaceId)
    if (isMember) {
      return {
        success: false,
        error: {
          message: 'Already a member of this workspace',
          code: 'ALREADY_MEMBER'
        }
      }
    }

    await acceptInviteQuery(invite, params.userId)
    return { success: true }
  } catch (error) {
    console.error('Error accepting invite:', error)
    return {
      success: false,
      error: {
        message: 'Failed to accept invite',
        code: 'INVALID_INPUT'
      }
    }
  }
} 