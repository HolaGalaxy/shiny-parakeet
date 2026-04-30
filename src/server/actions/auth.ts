'use server'

import { SESSION_COOKIE_NAME } from '@/constants/auth'
import { HttpStatus } from '@/constants/http'
import { sessionCookieOptions } from '@/lib/auth/session'
import { handleActionError } from '@/lib/http/http-error'
import { AuthService, loginInput } from '@/services/auth.service'
import type { ActionResponse } from '@/types/action'
import type { SessionUser } from '@/types/auth'
import { cookies } from 'next/headers'

type LoginSuccessData = { user: SessionUser }

export async function loginAction(payload: unknown): Promise<ActionResponse<LoginSuccessData>> {
  try {
    const parsed = loginInput.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        code: HttpStatus.BAD_REQUEST,
        details: parsed.error.flatten() as unknown as Record<string, unknown>,
      }
    }

    const { user, token } = await AuthService.login(parsed.data)

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions())

    return { success: true, data: { user }, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}
