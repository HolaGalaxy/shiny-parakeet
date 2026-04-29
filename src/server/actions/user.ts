'use server'

import { requireRole } from '@/lib/auth/require-session'
import { sendInviteEmail } from '@/lib/email/resend'
import { hashPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/db/prisma'
import { emailSchema, usernameSchema, passwordSchema } from '@/lib/validation/identifiers'
import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { handleActionError } from '@/lib/http/http-error'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import { INVITE_EXPIRY_HOURS } from '@/constants/auth'
import { ROUTES } from '@/constants/routes'
import type { ActionResponse } from '@/types/action'
import type { UserListItem } from '@/types/user'
import { UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(256),
  email: emailSchema,
  username: usernameSchema,
  role: z.nativeEnum(UserRole),
})

export async function getUsersAction(): Promise<ActionResponse<UserListItem[]>> {
  try {
    await requireRole('SUPER_ADMIN', 'ADMIN')

    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true, name: true, email: true, username: true,
        role: true, isActive: true, isDeleted: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      success: true,
      data: users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
      code: HttpStatus.OK,
    }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function createUserAction(
  payload: unknown,
): Promise<ActionResponse<{ id: string; inviteToken: string }>> {
  try {
    const session = await requireRole('SUPER_ADMIN', 'ADMIN')

    const parsed = createUserSchema.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        error: ERROR_MSG.VALIDATION_FAILED,
        code: HttpStatus.BAD_REQUEST,
        details: parsed.error.flatten() as unknown as Record<string, unknown>,
      }
    }

    const { name, email, username, role } = parsed.data

    if (role === 'SUPER_ADMIN' && session.role !== 'SUPER_ADMIN') {
      return { success: false, error: ERROR_MSG.SUPER_ADMIN_ONLY, code: HttpStatus.FORBIDDEN }
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }], isDeleted: false },
    })
    if (existing) {
      return { success: false, error: ERROR_MSG.USER_EXISTS, code: HttpStatus.CONFLICT }
    }

    const inviteToken = randomBytes(48).toString('base64url')
    const inviteExpiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000)
    const tempPassword = await hashPassword(randomBytes(32).toString('base64url'))

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name, email, username,
          password: tempPassword,
          role,
          isActive: false,
          inviteToken,
          inviteExpiresAt,
        },
        select: { id: true },
      })

      await writeAudit(
        {
          actorUserId: session.id,
          actorEmail: session.email,
          entityType: AuditEntity.USER,
          entityId: user.id,
          action: 'CREATE',
          payload: { name, email, username, role },
        },
        tx,
      )

      return user
    })

    await sendInviteEmail({ toEmail: email, toName: name, inviteToken })

    revalidatePath(ROUTES.USERS)
    return { success: true, data: { id: result.id, inviteToken }, code: HttpStatus.CREATED }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requireRole('SUPER_ADMIN', 'ADMIN')

    if (session.id === userId) {
      return { success: false, error: ERROR_MSG.CANNOT_DELETE_SELF, code: HttpStatus.BAD_REQUEST }
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isDeleted: true },
    })

    if (!target || target.isDeleted) {
      return { success: false, error: ERROR_MSG.USER_NOT_FOUND, code: HttpStatus.NOT_FOUND }
    }

    if (target.role === 'SUPER_ADMIN' && session.role !== 'SUPER_ADMIN') {
      return { success: false, error: ERROR_MSG.SUPER_ADMIN_DELETE_ONLY, code: HttpStatus.FORBIDDEN }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isDeleted: true, inviteToken: null, sessionVersion: { increment: 1 } },
      })

      await writeAudit(
        {
          actorUserId: session.id,
          actorEmail: session.email,
          entityType: AuditEntity.USER,
          entityId: userId,
          action: 'DELETE',
          payload: { targetRole: target.role },
        },
        tx,
      )
    })

    revalidatePath(ROUTES.USERS)
    return { success: true, data: { id: userId }, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function verifyInviteTokenAction(
  token: string,
): Promise<ActionResponse<{ email: string; name: string | null }>> {
  try {
    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      select: { id: true, email: true, name: true, inviteExpiresAt: true, isActive: true, isDeleted: true },
    })

    if (!user || user.isDeleted) {
      return { success: false, error: ERROR_MSG.INVITE_INVALID, code: HttpStatus.NOT_FOUND }
    }

    if (user.isActive) {
      return { success: false, error: ERROR_MSG.INVITE_ALREADY_ACTIVATED, code: HttpStatus.BAD_REQUEST }
    }

    if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
      return { success: false, error: ERROR_MSG.INVITE_EXPIRED, code: HttpStatus.GONE }
    }

    return { success: true, data: { email: user.email, name: user.name }, code: HttpStatus.OK }
  } catch {
    return { success: false, error: ERROR_MSG.INTERNAL, code: HttpStatus.INTERNAL }
  }
}

const activateSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
})

export async function activateAccountAction(
  payload: unknown,
): Promise<ActionResponse<{ email: string }>> {
  try {
    const parsed = activateSchema.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        error: ERROR_MSG.VALIDATION_FAILED,
        code: HttpStatus.BAD_REQUEST,
        details: parsed.error.flatten() as unknown as Record<string, unknown>,
      }
    }

    const { token, password } = parsed.data
    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      select: { id: true, email: true, inviteExpiresAt: true, isActive: true, isDeleted: true },
    })

    if (!user || user.isDeleted) {
      return { success: false, error: ERROR_MSG.INVITE_INVALID, code: HttpStatus.NOT_FOUND }
    }

    if (user.isActive) {
      return { success: false, error: ERROR_MSG.INVITE_ALREADY_ACTIVATED, code: HttpStatus.BAD_REQUEST }
    }

    if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
      return { success: false, error: ERROR_MSG.INVITE_EXPIRED_SHORT, code: HttpStatus.GONE }
    }

    const hashedPassword = await hashPassword(password)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, isActive: true, inviteToken: null, inviteExpiresAt: null },
    })

    return { success: true, data: { email: user.email }, code: HttpStatus.OK }
  } catch {
    return { success: false, error: ERROR_MSG.INTERNAL, code: HttpStatus.INTERNAL }
  }
}
