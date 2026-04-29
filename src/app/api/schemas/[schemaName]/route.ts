import { AuditAction } from '@prisma/client'
import { NextRequest } from 'next/server'
import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { requireSession } from '@/lib/auth/require-session'
import { prisma } from '@/lib/db/prisma'
import { HttpError, jsonError, jsonOk } from '@/lib/http/http-error'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'

type Params = { schemaName: string }

export async function GET(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    await requireSession()
    const { schemaName } = await context.params
    const schema = await prisma.schema.findUnique({
      where: { name: schemaName },
      include: { fields: { orderBy: { createdAt: 'asc' } }, feature: { select: { id: true } } },
    })
    if (!schema || !schema.feature) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.SCHEMA_NOT_FOUND, 'NOT_FOUND')
    }

    return jsonOk({
      schema: {
        id: schema.id, name: schema.name, createdAt: schema.createdAt, updatedAt: schema.updatedAt,
        featureId: schema.feature.id,
        fields: schema.fields.map((f) => ({
          id: f.id, name: f.name, valueType: f.valueType, defaultValue: f.defaultValue, createdAt: f.createdAt,
        })),
      },
    })
  } catch (e: unknown) {
    return jsonError(e)
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const session = await requireSession()
    const { schemaName } = await context.params

    const existing = await prisma.schema.findUnique({ where: { name: schemaName }, select: { id: true } })
    if (!existing) throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.SCHEMA_NOT_FOUND, 'NOT_FOUND')

    await prisma.schema.delete({ where: { id: existing.id } })

    await writeAudit({
      actorUserId: session.id, actorEmail: session.email,
      entityType: AuditEntity.SCHEMA, entityId: existing.id,
      action: AuditAction.DELETE, payload: { name: schemaName },
    })

    return jsonOk({ ok: true })
  } catch (e: unknown) {
    return jsonError(e)
  }
}
