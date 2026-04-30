import { UserRole } from '@prisma/client'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { hashPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/db/prisma'
import { sendInviteEmail } from '@/lib/email/resend'
import { HttpError } from '@/lib/http/http-error'
import { emailSchema, usernameSchema, passwordSchema } from '@/lib/validation/identifiers'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import { INVITE_EXPIRY_HOURS } from '@/constants/auth'
import type { SessionUser } from '@/types/auth'
import type { UserListItem } from '@/types/user'

// ─── Validation ─────────────────────────────────────────────────────────────

export const createUserInput = z.object({
  name: z.string().min(1, 'Name is required').max(256),
  email: emailSchema,
  username: usernameSchema,
  role: z.nativeEnum(UserRole),
})

export const activateAccountInput = z.object({
  token: z.string().min(1),
  password: passwordSchema,
})

export type CreateUserInput = z.infer<typeof createUserInput>
export type ActivateAccountInput = z.infer<typeof activateAccountInput>

// ─── Service ────────────────────────────────────────────────────────────────

export const UserService = {
  async list(): Promise<UserListItem[]> {
    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true, name: true, email: true, username: true,
        role: true, isActive: true, isDeleted: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))
  },

  async create(session: SessionUser, input: CreateUserInput): Promise<{ id: string; inviteToken: string }> {
    const { name, email, username, role } = input

    if (role === 'SUPER_ADMIN' && session.role !== 'SUPER_ADMIN') {
      throw new HttpError(HttpStatus.FORBIDDEN, ERROR_MSG.SUPER_ADMIN_ONLY, 'FORBIDDEN')
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }], isDeleted: false },
    })
    if (existing) {
      throw new HttpError(HttpStatus.CONFLICT, ERROR_MSG.USER_EXISTS, 'CONFLICT')
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

    return { id: result.id, inviteToken }
  },

  async delete(session: SessionUser, userId: string): Promise<{ id: string }> {
    if (session.id === userId) {
      throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.CANNOT_DELETE_SELF, 'CANNOT_DELETE_SELF')
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isDeleted: true },
    })

    if (!target || target.isDeleted) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.USER_NOT_FOUND, 'NOT_FOUND')
    }

    if (target.role === 'SUPER_ADMIN' && session.role !== 'SUPER_ADMIN') {
      throw new HttpError(HttpStatus.FORBIDDEN, ERROR_MSG.SUPER_ADMIN_DELETE_ONLY, 'FORBIDDEN')
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

    return { id: userId }
  },

  async verifyInviteToken(token: string): Promise<{ email: string; name: string | null }> {
    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      select: { id: true, email: true, name: true, inviteExpiresAt: true, isActive: true, isDeleted: true },
    })

    if (!user || user.isDeleted) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.INVITE_INVALID, 'NOT_FOUND')
    }

    if (user.isActive) {
      throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.INVITE_ALREADY_ACTIVATED, 'ALREADY_ACTIVATED')
    }

    if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
      throw new HttpError(HttpStatus.GONE, ERROR_MSG.INVITE_EXPIRED, 'EXPIRED')
    }

    return { email: user.email, name: user.name }
  },

  async activateAccount(input: ActivateAccountInput): Promise<{ email: string }> {
    const { token, password } = input

    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      select: { id: true, email: true, inviteExpiresAt: true, isActive: true, isDeleted: true },
    })

    if (!user || user.isDeleted) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.INVITE_INVALID, 'NOT_FOUND')
    }

    if (user.isActive) {
      throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.INVITE_ALREADY_ACTIVATED, 'ALREADY_ACTIVATED')
    }

    if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
      throw new HttpError(HttpStatus.GONE, ERROR_MSG.INVITE_EXPIRED_SHORT, 'EXPIRED')
    }

    const hashedPassword = await hashPassword(password)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, isActive: true, inviteToken: null, inviteExpiresAt: null },
    })

    return { email: user.email }
  },
} as const
