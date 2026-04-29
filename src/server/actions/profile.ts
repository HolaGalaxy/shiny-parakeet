'use server'

import { requireSession } from '@/lib/auth/require-session'
import { prisma } from '@/lib/db/prisma'
import { handleActionError } from '@/lib/http/http-error'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import type { ActionResponse } from '@/types/action'
import type { ProfileData } from '@/types/profile'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(256),
  profilePicture: z.string().url().max(512).optional().nullable(),
})

export async function getProfileAction(): Promise<ActionResponse<ProfileData>> {
  try {
    const session = await requireSession()

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        name: true, email: true, username: true,
        role: true, profilePicture: true, createdAt: true,
      },
    })

    if (!user) {
      return { success: false, error: ERROR_MSG.USER_NOT_FOUND, code: HttpStatus.NOT_FOUND }
    }

    return {
      success: true,
      data: { ...user, createdAt: user.createdAt.toISOString() },
      code: HttpStatus.OK,
    }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function updateProfileAction(
  payload: unknown,
): Promise<ActionResponse<ProfileData>> {
  try {
    const session = await requireSession()

    const parsed = updateProfileSchema.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        error: ERROR_MSG.VALIDATION_FAILED,
        code: HttpStatus.BAD_REQUEST,
        details: parsed.error.flatten() as unknown as Record<string, unknown>,
      }
    }

    const { name, profilePicture } = parsed.data

    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        name,
        ...(profilePicture !== undefined ? { profilePicture } : {}),
      },
      select: {
        name: true, email: true, username: true,
        role: true, profilePicture: true, createdAt: true,
      },
    })

    return {
      success: true,
      data: { ...user, createdAt: user.createdAt.toISOString() },
      code: HttpStatus.OK,
    }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}
