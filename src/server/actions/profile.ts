'use server'

import { requireSession } from '@/lib/auth/require-session'
import { handleActionError } from '@/lib/http/http-error'
import { HttpStatus } from '@/constants/http'
import { ProfileService, updateProfileInput } from '@/services/profile.service'
import type { ActionResponse } from '@/types/action'
import type { ProfileData } from '@/types/profile'

export async function getProfileAction(): Promise<ActionResponse<ProfileData>> {
  try {
    const session = await requireSession()
    const data = await ProfileService.get(session)
    return { success: true, data, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function updateProfileAction(
  payload: unknown,
): Promise<ActionResponse<ProfileData>> {
  try {
    const session = await requireSession()

    const parsed = updateProfileInput.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        code: HttpStatus.BAD_REQUEST,
        details: parsed.error.flatten() as unknown as Record<string, unknown>,
      }
    }

    const data = await ProfileService.update(session, parsed.data)
    return { success: true, data, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}
