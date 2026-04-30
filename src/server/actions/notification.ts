'use server'

import { requireSession } from '@/lib/auth/require-session'
import { handleActionError } from '@/lib/http/http-error'
import { HttpStatus } from '@/constants/http'
import { NotificationService } from '@/services/notification.service'
import type { ActionResponse } from '@/types/action'
import type { NotificationItem } from '@/types/notification'

export async function getNotificationsAction(): Promise<
  ActionResponse<{ notifications: NotificationItem[]; unreadCount: number }>
> {
  try {
    const session = await requireSession()
    const data = await NotificationService.list(session)
    return { success: true, data, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function markNotificationsReadAction(
  ids: string[],
): Promise<ActionResponse<void>> {
  try {
    const session = await requireSession()
    await NotificationService.markRead(session, ids)
    return { success: true, data: undefined, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResponse<void>> {
  try {
    const session = await requireSession()
    await NotificationService.markAllRead(session)
    return { success: true, data: undefined, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}
