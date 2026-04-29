import { HttpError } from '@/lib/http/http-error'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import { isAdmin, hasWriteAccess } from '@/constants/roles'
import type { UserRole } from '@prisma/client'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'
import { getSessionFromCookie } from './session'
import type { SessionUser } from '@/types/auth'

export async function requireSession(): Promise<SessionUser> {
  const cookie = await cookies()
  const session = await getSessionFromCookie(cookie)
  if (!session) {
    throw new HttpError(HttpStatus.UNAUTHORIZED, ERROR_MSG.AUTH_REQUIRED, 'UNAUTHORIZED')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { sessionVersion: true, isActive: true, isDeleted: true },
  })

  if (!dbUser || dbUser.isDeleted || !dbUser.isActive) {
    throw new HttpError(HttpStatus.UNAUTHORIZED, ERROR_MSG.ACCOUNT_DEACTIVATED, 'ACCOUNT_DEACTIVATED')
  }

  if (dbUser.sessionVersion !== session.sessionVersion) {
    throw new HttpError(HttpStatus.UNAUTHORIZED, ERROR_MSG.SESSION_INVALIDATED, 'SESSION_INVALIDATED')
  }

  return session
}

export async function requireRole(...allowedRoles: UserRole[]): Promise<SessionUser> {
  const session = await requireSession()
  if (!allowedRoles.includes(session.role)) {
    throw new HttpError(HttpStatus.FORBIDDEN, ERROR_MSG.INSUFFICIENT_PERMISSIONS, 'FORBIDDEN')
  }
  return session
}

export { isAdmin, hasWriteAccess }
