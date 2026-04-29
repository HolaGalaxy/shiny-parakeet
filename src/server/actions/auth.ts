'use server'

import { SESSION_COOKIE_NAME } from '@/constants/auth'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import { verifyPassword } from '@/lib/auth/password'
import { type SessionUser } from '@/types/auth'
import { sessionCookieOptions, signSessionToken } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { handleActionError } from '@/lib/http/http-error'
import { emailSchema } from '@/lib/validation/identifiers'
import type { ActionResponse } from '@/types/action'
import { cookies } from 'next/headers'
import { z } from 'zod'

const bodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

type LoginSuccessData = { user: SessionUser }

export async function loginAction(payload: unknown): Promise<ActionResponse<LoginSuccessData>> {
  try {
    const parsed = bodySchema.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        error: ERROR_MSG.VALIDATION_FAILED,
        code: HttpStatus.BAD_REQUEST,
        details: parsed.error.flatten() as unknown as Record<string, unknown>,
      }
    }

    const { email, password } = parsed.data
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !(await verifyPassword(password, user.password))) {
      return { success: false, error: ERROR_MSG.INVALID_CREDENTIALS, code: HttpStatus.UNAUTHORIZED }
    }

    if (user.isDeleted) {
      return { success: false, error: ERROR_MSG.ACCOUNT_DELETED, code: HttpStatus.FORBIDDEN }
    }

    if (!user.isActive) {
      return { success: false, error: ERROR_MSG.ACCOUNT_NOT_ACTIVE, code: HttpStatus.FORBIDDEN }
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

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions())

    return { success: true, data: { user: updated }, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}
