import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()
  if (!userId) {
    redirect('/sign-in')
  }

  return <>{children}</>
} 