import type { NotificationType } from '@prisma/client'

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  message: string
  metadata: unknown
  isRead: boolean
  createdAt: string
}
