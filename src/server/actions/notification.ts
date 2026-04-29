'use server'

import { requireSession } from '@/lib/auth/require-session'
import { prisma } from '@/lib/db/prisma'
import { handleActionError } from '@/lib/http/http-error'
import { HttpStatus } from '@/constants/http'
import type { ActionResponse } from '@/types/action'
import type { NotificationItem } from '@/types/notification'
import type { NotificationType } from '@prisma/client'

export async function createNotification(params: {
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    },
  })
}

export async function getNotificationsAction(): Promise<
  ActionResponse<{ notifications: NotificationItem[]; unreadCount: number }>
> {
  try {
    const session = await requireSession()

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.notification.count({
        where: { userId: session.id, isRead: false },
      }),
    ])

    return {
      success: true,
      data: {
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          metadata: n.metadata,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        })),
        unreadCount,
      },
      code: HttpStatus.OK,
    }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function markNotificationsReadAction(
  ids: string[],
): Promise<ActionResponse<void>> {
  try {
    const session = await requireSession()

    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: session.id },
      data: { isRead: true },
    })

    return { success: true, data: undefined, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResponse<void>> {
  try {
    const session = await requireSession()

    await prisma.notification.updateMany({
      where: { userId: session.id, isRead: false },
      data: { isRead: true },
    })

    return { success: true, data: undefined, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}
