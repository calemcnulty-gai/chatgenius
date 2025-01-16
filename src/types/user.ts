import { Timestamp } from './timestamp'
import type { userAuth } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

type UserAuth = InferSelectModel<typeof userAuth>

export interface User {
  id: string
  name: string
  email: string
  profileImage: string | null
  displayName: string | null
  title: string | null
  timeZone: string | null
  status: 'active' | 'away' | 'offline'
  lastHeartbeat: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
  userAuth?: UserAuth[]
} 