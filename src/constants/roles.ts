import type { UserRole } from '@prisma/client'

export const ROLE_HIERARCHY: Readonly<Record<UserRole, number>> = {
  SUPER_ADMIN: 40,
  ADMIN: 30,
  READ_WRITE: 20,
  READ_ONLY: 10,
} as const

export const ADMIN_ROLES: readonly UserRole[] = ['SUPER_ADMIN', 'ADMIN'] as const

export function isAdmin(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN
}

export function hasWriteAccess(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.READ_WRITE
}
