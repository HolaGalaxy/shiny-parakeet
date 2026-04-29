import { prisma } from '@/lib/db/prisma'
import { AuditEntity, type AuditEntityType } from '@/constants/audit'
import type { AuditAction, Prisma } from '@prisma/client'

type AuditPayload = {
  actorUserId: string
  actorEmail: string
  entityType: AuditEntityType
  entityId: string
  action: AuditAction
  payload: Record<string, unknown> | null
}

export async function writeAudit(
  data: AuditPayload,
  db: Prisma.TransactionClient | typeof prisma = prisma,
) {
  return db.auditLog.create({
    data: {
      actorUserId: data.actorUserId,
      actorEmail: data.actorEmail,
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      payload: data.payload ? JSON.stringify(data.payload) : undefined,
    },
  })
}

export { AuditEntity }
