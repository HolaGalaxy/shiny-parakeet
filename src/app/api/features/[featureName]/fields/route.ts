import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth/require-session'
import { prisma } from '@/lib/db/prisma'
import { HttpError, jsonError, jsonOk } from '@/lib/http/http-error'
import { resolveEffectiveJsonValues } from '@/lib/switch/effective-value'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'

type Params = { featureName: string }

export async function GET(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    await requireSession()
    const { featureName } = await context.params

    const schema = await prisma.schema.findUnique({
      where: { name: featureName },
      include: { fields: { orderBy: { createdAt: 'asc' } }, feature: true },
    })
    if (!schema || !schema.feature) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.FEATURE_NOT_FOUND, 'NOT_FOUND')
    }

    const fieldIds = schema.fields.map((f) => f.id)

    const refs = await prisma.fieldReference.findMany({
      where: {
        consumerSchemaFieldId: { in: fieldIds },
      },
      include: {
        targetField: {
          select: { id: true, name: true },
        },
        targetFeature: {
          include: {
            schema: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    const refMap = new Map(
      refs.map((r) => [r.consumerSchemaFieldId, r]),
    )
    console.log('fieldIds', fieldIds, refMap)
    const effectiveMap = await resolveEffectiveJsonValues(fieldIds)

    const fields = schema.fields.map((f) => {
      const ref = refMap.get(f.id)
      const effectiveValue = effectiveMap.get(f.id)

      return {
        schemaFieldId: f.id,
        name: f.name,
        valueType: f.valueType,
        defaultValue: f.defaultValue,
        createdAt: f.createdAt,
        effectiveValue,
        reference: ref
          ? {
            id: ref.id,
            targetSchemaName: ref.targetFeature.schema.name,
            targetFieldName: ref.targetField.name,
            targetSchemaFieldId: ref.targetSchemaFieldId,
            targetFeatureId: ref.targetFeatureId,
          }
          : null,
      }
    })

    return jsonOk({
      schemaId: schema.id,
      schemaName: schema.name,
      featureId: schema.feature.id,
      featureName: schema.name,
      fields,
    })
  } catch (e: unknown) {
    return jsonError(e)
  }
}
