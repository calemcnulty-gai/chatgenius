import { currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaceMemberships } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { getOrCreateUser } from '@/lib/db/users'
import { WorkspaceMembership } from '@/types/db'

export default async function WorkspacesPage() {
  const clerkUser = await currentUser()
  if (!clerkUser) {
    throw new Error('User not found')
  }

  // Get or create the internal user
  const user = await getOrCreateUser({
    id: clerkUser.id,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    emailAddresses: clerkUser.emailAddresses,
    imageUrl: clerkUser.imageUrl,
  })

  // Fetch workspaces for the current user using internal ID
  const userWorkspaces = await db.query.workspaceMemberships.findMany({
    where: eq(workspaceMemberships.userId, user.id),
    with: {
      workspace: true
    }
  }) as (WorkspaceMembership & { workspace: { id: string; name: string; slug: string; description: string | null } })[]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Workspaces</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userWorkspaces.map(({ workspace }) => (
            <Link
              key={workspace.id}
              href={`/workspace/${workspace.slug}`}
              className="block p-6 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2">{workspace.name}</h2>
              {workspace.description && (
                <p className="text-gray-400">{workspace.description}</p>
              )}
            </Link>
          ))}
        </div>

        {userWorkspaces.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p>You don't have any workspaces yet.</p>
          </div>
        )}
      </div>
    </div>
  )
} 