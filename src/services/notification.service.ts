import { prisma } from '@/lib/db/prisma'
import { HttpError } from '@/lib/http/http-error'
import { HttpStatus } from '@/constants/http'
import type { SessionUser } from '@/types/auth'
import type { NotificationItem } from '@/types/notification'
import type { NotificationType } from '@prisma/client'

// ─── DTOs ───────────────────────────────────────────────────────────────────

export type NotificationsDTO = {
  notifications: NotificationItem[]
  unreadCount: number
}

// ─── Service ────────────────────────────────────────────────────────────────

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

export const NotificationService = {
  async list(session: SessionUser): Promise<NotificationsDTO> {
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
    }
  },

  async markRead(session: SessionUser, ids: string[]): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: session.id },
      data: { isRead: true },
    })
  },

  async markAllRead(session: SessionUser): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId: session.id, isRead: false },
      data: { isRead: true },
    })
  },
} as const
