import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { signSessionToken } from '@/lib/auth/session'
import { HttpError } from '@/lib/http/http-error'
import { emailSchema } from '@/lib/validation/identifiers'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import type { SessionUser } from '@/types/auth'

// ─── Validation ─────────────────────────────────────────────────────────────

export const loginInput = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginInput>

// ─── DTOs ───────────────────────────────────────────────────────────────────

export type LoginResult = {
  user: SessionUser
  token: string
}

// ─── Service ────────────────────────────────────────────────────────────────

export const AuthService = {
  async login(input: LoginInput): Promise<LoginResult> {
    const { email, password } = input

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !(await verifyPassword(password, user.password))) {
      throw new HttpError(HttpStatus.UNAUTHORIZED, ERROR_MSG.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS')
    }

    if (user.isDeleted) {
      throw new HttpError(HttpStatus.FORBIDDEN, ERROR_MSG.ACCOUNT_DELETED, 'ACCOUNT_DELETED')
    }

    if (!user.isActive) {
      throw new HttpError(HttpStatus.FORBIDDEN, ERROR_MSG.ACCOUNT_NOT_ACTIVE, 'ACCOUNT_NOT_ACTIVE')
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: { increment: 1 } },
      select: {
        id: true, name: true, email: true, username: true,
        role: true, isActive: true, isDeleted: true,
        profilePicture: true, sessionVersion: true,
        createdAt: true, updatedAt: true,
      },
    })

    const token = await signSessionToken(updated)

    return { user: updated, token }
  },
} as const
