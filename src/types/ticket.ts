import type { TicketStatus, TicketType } from '@prisma/client'

export type TicketListItem = {
  id: string
  type: TicketType
  status: TicketStatus
  schemaName: string
  schemaFieldName: string | null
  createdByEmail: string
  createdByName: string | null
  createdAt: string
}

export type TicketDetail = TicketListItem & {
  oldValue: unknown
  newValue: unknown
  reviewComment: string | null
  reviewedByEmail: string | null
  reviewedAt: string | null
}
