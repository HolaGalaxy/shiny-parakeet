import { TicketStatus, TicketType, type FieldValueType, type Prisma } from '@prisma/client'
import { z } from 'zod'
import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { isAdmin } from '@/constants/roles'
import { prisma } from '@/lib/db/prisma'
import { HttpError } from '@/lib/http/http-error'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import type { SessionUser } from '@/types/auth'
import type { TicketListItem, TicketDetail } from '@/types/ticket'
import { createNotification } from '@/services/notification.service'

// ─── Validation ─────────────────────────────────────────────────────────────

export const createTicketInput = z.object({
  type: z.nativeEnum(TicketType),
  schemaId: z.string().uuid(),
  schemaFieldId: z.string().uuid().optional(),
  featureId: z.string().uuid().optional(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown(),
})

export const reviewTicketInput = z.object({
  ticketId: z.string().uuid(),
  action: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().max(1024).optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketInput>
export type ReviewTicketInput = z.infer<typeof reviewTicketInput>

// ─── Service ────────────────────────────────────────────────────────────────

export const TicketService = {
  async list(filters?: { status?: TicketStatus; schemaId?: string }): Promise<TicketListItem[]> {
    const where: Record<string, unknown> = {}
    if (filters?.status) where.status = filters.status
    if (filters?.schemaId) where.schemaId = filters.schemaId

    const schemaIds = [
      ...new Set(
        (await prisma.ticket.findMany({ where, select: { schemaId: true } })).map((t) => t.schemaId),
      ),
    ]
    const schemas = await prisma.schema.findMany({
      where: { id: { in: schemaIds } },
      select: { id: true, name: true },
    })
    const schemaMap = new Map(schemas.map((s) => [s.id, s.name]))

    const fieldTickets = await prisma.ticket.findMany({
      where: { ...where, schemaFieldId: { not: null } },
      select: { id: true, schemaFieldId: true },
    })
    const fieldIds = fieldTickets.map((t) => t.schemaFieldId).filter(Boolean) as string[]
    const fields = await prisma.schemaField.findMany({
      where: { id: { in: fieldIds } },
      select: { id: true, name: true },
    })
    const fieldMap = new Map(fields.map((f) => [f.id, f.name]))

    const rawTickets = await prisma.ticket.findMany({
      where,
      select: {
        id: true, type: true, status: true, schemaId: true, schemaFieldId: true,
        createdAt: true,
        createdBy: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return rawTickets.map((t) => ({
      id: t.id,
      type: t.type,
      status: t.status,
      schemaName: schemaMap.get(t.schemaId) ?? 'unknown',
      schemaFieldName: t.schemaFieldId ? (fieldMap.get(t.schemaFieldId) ?? null) : null,
      createdByEmail: t.createdBy.email,
      createdByName: t.createdBy.name,
      createdAt: t.createdAt.toISOString(),
    }))
  },

  async getDetail(ticketId: string): Promise<TicketDetail> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: { select: { email: true, name: true } },
        reviewedBy: { select: { email: true } },
      },
    })

    if (!ticket) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.TICKET_NOT_FOUND, 'NOT_FOUND')
    }

    const schema = await prisma.schema.findUnique({
      where: { id: ticket.schemaId },
      select: { name: true },
    })

    let fieldName: string | null = null
    if (ticket.schemaFieldId) {
      const field = await prisma.schemaField.findUnique({
        where: { id: ticket.schemaFieldId },
        select: { name: true },
      })
      fieldName = field?.name ?? null
    }

    return {
      id: ticket.id,
      type: ticket.type,
      status: ticket.status,
      schemaName: schema?.name ?? 'unknown',
      schemaFieldName: fieldName,
      oldValue: ticket.oldValue,
      newValue: ticket.newValue,
      reviewComment: ticket.reviewComment,
      createdByEmail: ticket.createdBy.email,
      createdByName: ticket.createdBy.name,
      reviewedByEmail: ticket.reviewedBy?.email ?? null,
      reviewedAt: ticket.reviewedAt?.toISOString() ?? null,
      createdAt: ticket.createdAt.toISOString(),
    }
  },

  async create(session: SessionUser, input: CreateTicketInput): Promise<{ id: string }> {
    if (isAdmin(session.role)) {
      throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.TICKET_ADMIN_NOT_ALLOWED, 'ADMIN_NOT_ALLOWED')
    }

    const { type, schemaId, schemaFieldId, featureId, oldValue, newValue } = input

    if (schemaFieldId) {
      const existing = await prisma.ticket.findFirst({
        where: { schemaFieldId, status: 'PENDING' },
      })
      if (existing) {
        throw new HttpError(HttpStatus.CONFLICT, ERROR_MSG.TICKET_PENDING_EXISTS, 'PENDING_EXISTS')
      }
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          type,
          status: 'PENDING',
          schemaId,
          schemaFieldId: schemaFieldId ?? null,
          featureId: featureId ?? null,
          oldValue: (oldValue as Prisma.InputJsonValue) ?? undefined,
          newValue: newValue as Prisma.InputJsonValue,
          createdById: session.id,
        },
        select: { id: true },
      })

      await writeAudit(
        {
          actorUserId: session.id,
          actorEmail: session.email,
          entityType: AuditEntity.SCHEMA,
          entityId: schemaId,
          action: 'CREATE',
          payload: { ticketId: created.id, type },
        },
        tx,
      )

      return created
    })

    const admins = await prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true, isDeleted: false },
      select: { id: true },
    })

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          type: 'TICKET_CREATED',
          title: 'New Ticket',
          message: `${session.email} created a ${type.replace(/_/g, ' ').toLowerCase()} ticket`,
          metadata: { ticketId: ticket.id, schemaId },
        }),
      ),
    )

    return { id: ticket.id }
  },

  async review(session: SessionUser, input: ReviewTicketInput): Promise<{ id: string }> {
    const { ticketId, action, comment } = input

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.TICKET_NOT_FOUND, 'NOT_FOUND')
    }
    if (ticket.status !== 'PENDING') {
      throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.TICKET_ALREADY_REVIEWED, 'ALREADY_REVIEWED')
    }

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: action,
          reviewComment: comment ?? null,
          reviewedById: session.id,
          reviewedAt: new Date(),
        },
      })

      if (action === 'APPROVED') {
        await applyTicketChanges(tx, ticket)
      }

      await writeAudit(
        {
          actorUserId: session.id,
          actorEmail: session.email,
          entityType: AuditEntity.SCHEMA,
          entityId: ticket.schemaId,
          action: 'UPDATE',
          payload: { ticketId, action, comment: comment ?? null },
        },
        tx,
      )
    })

    const notifType = action === 'APPROVED' ? ('TICKET_APPROVED' as const) : ('TICKET_REJECTED' as const)
    await createNotification({
      userId: ticket.createdById,
      type: notifType,
      title: `Ticket ${action.toLowerCase()}`,
      message: `Your ${ticket.type.replace(/_/g, ' ').toLowerCase()} ticket was ${action.toLowerCase()}${comment ? `: ${comment}` : ''}`,
      metadata: { ticketId },
    })

    return { id: ticketId }
  },
} as const

// ─── Internal Helpers ───────────────────────────────────────────────────────

async function applyTicketChanges(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  ticket: {
    type: TicketType
    schemaId: string
    schemaFieldId: string | null
    featureId: string | null
    newValue: unknown
  },
) {
  switch (ticket.type) {
    case 'SCHEMA_FIELD_ADD': {
      const val = ticket.newValue as { name: string; valueType: FieldValueType; defaultValue: Prisma.InputJsonValue }
      await tx.schemaField.create({
        data: {
          schemaId: ticket.schemaId,
          name: val.name,
          valueType: val.valueType,
          defaultValue: val.defaultValue,
        },
      })
      break
    }
    case 'SCHEMA_FIELD_UPDATE': {
      if (!ticket.schemaFieldId) break
      const val = ticket.newValue as Record<string, unknown>
      await tx.schemaField.update({
        where: { id: ticket.schemaFieldId },
        data: {
          ...(typeof val.name === 'string' ? { name: val.name } : {}),
          ...(typeof val.valueType === 'string' ? { valueType: val.valueType as FieldValueType } : {}),
          ...(val.defaultValue !== undefined ? { defaultValue: val.defaultValue as Prisma.InputJsonValue } : {}),
        },
      })
      break
    }
    case 'SCHEMA_FIELD_DELETE': {
      if (!ticket.schemaFieldId) break
      await tx.schemaField.delete({ where: { id: ticket.schemaFieldId } })
      break
    }
    case 'FEATURE_VALUE_UPDATE': {
      if (!ticket.featureId || !ticket.schemaFieldId) break
      await tx.featureFieldValue.upsert({
        where: { schemaFieldId: ticket.schemaFieldId },
        create: {
          featureId: ticket.featureId,
          schemaFieldId: ticket.schemaFieldId,
          value: ticket.newValue as Prisma.InputJsonValue,
        },
        update: { value: ticket.newValue as Prisma.InputJsonValue },
      })
      break
    }
  }
}
