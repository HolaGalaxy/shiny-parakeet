import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { HttpError } from '@/lib/http/http-error'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import type { SessionUser } from '@/types/auth'
import type { ProfileData } from '@/types/profile'

// ─── Validation ─────────────────────────────────────────────────────────────

export const updateProfileInput = z.object({
  name: z.string().min(1, 'Name is required').max(256),
  profilePicture: z.string().url().max(512).optional().nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileInput>

// ─── Service ────────────────────────────────────────────────────────────────

export const ProfileService = {
  async get(session: SessionUser): Promise<ProfileData> {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        name: true, email: true, username: true,
        role: true, profilePicture: true, createdAt: true,
      },
    })

    if (!user) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.USER_NOT_FOUND, 'NOT_FOUND')
    }

    return { ...user, createdAt: user.createdAt.toISOString() }
  },

  async update(session: SessionUser, input: UpdateProfileInput): Promise<ProfileData> {
    const { name, profilePicture } = input

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

    return { ...user, createdAt: user.createdAt.toISOString() }
  },
} as const
