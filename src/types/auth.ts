import type { UserRole } from '@prisma/client'

export type SessionUser = {
  id: string
  name: string | null
  email: string
  username: string
  role: UserRole
  isActive: boolean
  isDeleted: boolean
  profilePicture: string | null
  sessionVersion: number
  createdAt: Date | string
  updatedAt: Date | string
}

export type LoginPayload = {
  email: string
  password: string
}
