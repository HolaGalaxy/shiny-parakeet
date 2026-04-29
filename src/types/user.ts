import type { UserRole } from '@prisma/client'

export type UserListItem = {
  id: string
  name: string | null
  email: string
  username: string
  role: UserRole
  isActive: boolean
  isDeleted: boolean
  createdAt: string
}

export type UserRow = {
  id: string
  name: string | null
  email: string
  role: string
  status: string
  createdAt: string
}
