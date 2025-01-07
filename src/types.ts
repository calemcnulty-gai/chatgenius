export type Channel = {
  id: string
  workspaceId: string
  name: string
  type: 'public' | 'private'
  createdAt: Date
  updatedAt: Date
} 