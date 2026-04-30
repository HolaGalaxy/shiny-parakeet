'use server'

import { requireRole } from '@/lib/auth/require-session'
import { handleActionError } from '@/lib/http/http-error'
import { HttpStatus } from '@/constants/http'
import { ROUTES } from '@/constants/routes'
import { UserService, createUserInput, activateAccountInput } from '@/services/user.service'
import type { ActionResponse } from '@/types/action'
import type { UserListItem } from '@/types/user'
import { revalidatePath } from 'next/cache'

export async function getUsersAction(): Promise<ActionResponse<UserListItem[]>> {
  try {
    await requireRole('SUPER_ADMIN', 'ADMIN')
    const data = await UserService.list()
    return { success: true, data, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function createUserAction(
  payload: unknown,
): Promise<ActionResponse<{ id: string; inviteToken: string }>> {
  try {
    const session = await requireRole('SUPER_ADMIN', 'ADMIN')

    const parsed = createUserInput.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        code: HttpStatus.BAD_REQUEST,
        details: parsed.error.flatten() as unknown as Record<string, unknown>,
      }
    }

    const result = await UserService.create(session, parsed.data)

    revalidatePath(ROUTES.USERS)
    return { success: true, data: result, code: HttpStatus.CREATED }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requireRole('SUPER_ADMIN', 'ADMIN')
    const result = await UserService.delete(session, userId)

    revalidatePath(ROUTES.USERS)
    return { success: true, data: result, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function verifyInviteTokenAction(
  token: string,
): Promise<ActionResponse<{ email: string; name: string | null }>> {
  try {
    const data = await UserService.verifyInviteToken(token)
    return { success: true, data, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function activateAccountAction(
  payload: unknown,
): Promise<ActionResponse<{ email: string }>> {
  try {
    const parsed = activateAccountInput.safeParse(payload)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        code: HttpStatus.BAD_REQUEST,
        details: parsed.error.flatten() as unknown as Record<string, unknown>,
      }
    }

    const data = await UserService.activateAccount(parsed.data)
    return { success: true, data, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}
