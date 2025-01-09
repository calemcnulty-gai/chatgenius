export interface User {
  id: string
  clerkId: string
  name: string
  email: string
  profileImage: string | null
  displayName: string | null
  title: string | null
  timeZone: string | null
  status: 'active' | 'away' | 'offline'
  createdAt: string
  updatedAt: string
} 