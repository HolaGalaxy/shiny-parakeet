import { AuditAction, type Prisma } from '@prisma/client'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { requireSession } from '@/lib/auth/require-session'
import { prisma } from '@/lib/db/prisma'
import { HttpError, jsonError, jsonOk } from '@/lib/http/http-error'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'

const patchBody = z.object({ value: z.unknown() })

type Params = { featureName: string; fieldId: string }

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const session = await requireSession()
    const { featureName, fieldId } = await context.params

    let json: unknown
    try { json = await request.json() } catch {
      throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.INVALID_JSON, 'INVALID_JSON')
    }

    const parsed = patchBody.safeParse(json)
    if (!parsed.success) {
      throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.VALIDATION_FAILED, 'VALIDATION', parsed.error.flatten())
    }

    const bundle = await prisma.schema.findUnique({
      where: { name: featureName },
      include: { feature: true, fields: { where: { id: fieldId } } },
    })
    if (!bundle?.feature || bundle.fields.length === 0) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.FIELD_NOT_IN_FEATURE, 'NOT_FOUND')
    }

    const ref = await prisma.fieldReference.findUnique({ where: { consumerSchemaFieldId: fieldId } })
    if (ref) throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.REFERENCE_ACTIVE, 'REFERENCE_ACTIVE')

    const nextValue = parsed.data.value

    if (nextValue === null) {
      const deleted = await prisma.featureFieldValue.deleteMany({
        where: { schemaFieldId: fieldId, featureId: bundle.feature.id },
      })
      await writeAudit({
        actorUserId: session.id, actorEmail: session.email,
        entityType: AuditEntity.FEATURE_FIELD_VALUE, entityId: fieldId,
        action: AuditAction.UPDATE, payload: { featureName, schemaFieldId: fieldId, cleared: true },
      })
      return jsonOk({ cleared: true, deletedCount: deleted.count })
    }

    const jsonValue = nextValue as Prisma.InputJsonValue

    const fv = await prisma.featureFieldValue.upsert({
      where: { schemaFieldId: fieldId },
      create: { featureId: bundle.feature.id, schemaFieldId: fieldId, value: jsonValue },
      update: { value: jsonValue },
      select: { id: true, value: true, updatedAt: true },
    })

    await writeAudit({
      actorUserId: session.id, actorEmail: session.email,
      entityType: AuditEntity.FEATURE_FIELD_VALUE, entityId: fv.id,
        action: AuditAction.UPDATE, payload: { featureName, schemaFieldId: fieldId },
    })

    return jsonOk({ featureFieldValue: fv })
  } catch (e: unknown) {
    return jsonError(e)
  }
}
