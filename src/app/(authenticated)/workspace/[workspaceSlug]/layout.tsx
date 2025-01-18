import { redirect } from 'next/navigation'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { WorkspaceLayoutClient } from '@/components/workspace/WorkspaceLayoutClient'
import { getWorkspaceLayoutData } from '@/services/workspace/layout'
import type { ValidationError } from '@/types/workspace/layout'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  const { userId, error: authError } = await getAuthenticatedUserId()
  if (authError || !userId) {
    redirect('/sign-in')
  }

  try {
    const { workspace, channels, users, dmChannels } = await getWorkspaceLayoutData(params.workspaceSlug, userId)

    return (
      <WorkspaceLayoutClient
        workspace={workspace}
        channels={channels}
        users={users}
        dmChannels={dmChannels}
      >
        {children}
      </WorkspaceLayoutClient>
    )
  } catch (error) {
    const validationError = error as ValidationError
    if (validationError.redirect) {
      redirect(validationError.redirect)
    }
    throw error
  }
} 