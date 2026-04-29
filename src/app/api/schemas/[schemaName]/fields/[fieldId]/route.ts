import { AuditAction } from '@prisma/client'
import { NextRequest } from 'next/server'
import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { requireSession } from '@/lib/auth/require-session'
import { prisma } from '@/lib/db/prisma'
import { HttpError, jsonError, jsonOk } from '@/lib/http/http-error'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'

type Params = { schemaName: string; fieldId: string }

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const session = await requireSession()
    const { schemaName, fieldId } = await context.params

    const field = await prisma.schemaField.findFirst({
      where: { id: fieldId, schema: { name: schemaName } },
      select: { id: true, name: true },
    })
    if (!field) throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.FIELD_NOT_FOUND, 'NOT_FOUND')

    await prisma.schemaField.delete({ where: { id: field.id } })

    await writeAudit({
      actorUserId: session.id, actorEmail: session.email,
      entityType: AuditEntity.SCHEMA_FIELD, entityId: field.id,
      action: AuditAction.DELETE, payload: { schemaName, fieldName: field.name },
    })

    return jsonOk({ ok: true })
  } catch (e: unknown) {
    return jsonError(e)
  }
}
