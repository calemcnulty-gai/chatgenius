import { db } from '@/db'
import { invites, workspaceMemberships } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { now } from '@/types/timestamp'
import type { DBInvite, CreateInviteParams } from './types'

export async function createInvite(params: CreateInviteParams): Promise<DBInvite> {
  const token = uuidv4()
  const [invite] = await db.insert(invites).values({
    email: params.email,
    workspaceId: params.workspaceId,
    inviterId: params.inviterId,
    token,
    status: 'pending',
    expiresAt: sql`CURRENT_TIMESTAMP + INTERVAL '7 days'`,
    createdAt: now(),
    updatedAt: now(),
  }).returning()

  return invite
}

export async function findInviteByToken(token: string): Promise<DBInvite | undefined> {
  return await db.query.invites.findFirst({
    where: eq(invites.token, token),
  })
}

export async function findInviteByEmailAndWorkspace(
  email: string,
  workspaceId: string
): Promise<DBInvite | undefined> {
  return await db.query.invites.findFirst({
    where: and(
      eq(invites.email, email),
      eq(invites.workspaceId, workspaceId)
    ),
  })
}

export async function isWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const membership = await db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.userId, userId),
      eq(workspaceMemberships.workspaceId, workspaceId)
    ),
  })
  return !!membership
}

export async function acceptInvite(invite: DBInvite, userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // Create workspace membership
    await tx.insert(workspaceMemberships).values({
      userId,
      workspaceId: invite.workspaceId,
      role: 'member',
      createdAt: now(),
      updatedAt: now(),
    })

    // Delete the invite
    await tx.delete(invites)
      .where(eq(invites.id, invite.id))
  })
} 