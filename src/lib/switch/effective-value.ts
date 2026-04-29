import { prisma } from '@/lib/db/prisma'
import { HttpError } from '@/lib/http/http-error'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'

const MAX_REF_DEPTH = 8

export async function resolveEffectiveJsonValues(
  schemaFieldIds: string[],
): Promise<Map<string, unknown>> {
  const allIds = new Set(schemaFieldIds)

  let frontier = [...schemaFieldIds]
  for (let depth = 0; depth < MAX_REF_DEPTH && frontier.length > 0; depth++) {
    const refs = await prisma.fieldReference.findMany({
      where: { consumerSchemaFieldId: { in: frontier } },
    })

    frontier = []
    for (const r of refs) {
      if (!allIds.has(r.targetSchemaFieldId)) {
        allIds.add(r.targetSchemaFieldId)
        frontier.push(r.targetSchemaFieldId)
      }
    }
  }

  const expandedIds = [...allIds]

  const [refs, overrides, fields] = await Promise.all([
    prisma.fieldReference.findMany({
      where: { consumerSchemaFieldId: { in: expandedIds } },
    }),
    prisma.featureFieldValue.findMany({
      where: { schemaFieldId: { in: expandedIds } },
    }),
    prisma.schemaField.findMany({
      where: { id: { in: expandedIds } },
    }),
  ])

  const refMap = new Map(
    refs.map((r) => [r.consumerSchemaFieldId, r.targetSchemaFieldId]),
  )

  const overrideMap = new Map(
    overrides.map((o) => [o.schemaFieldId, o.value]),
  )

  const defaultMap = new Map(
    fields.map((f) => [f.id, f.defaultValue]),
  )

  const result = new Map<string, unknown>()

  const resolve = (id: string, depth = 0): unknown => {
    if (depth > MAX_REF_DEPTH) {
      throw new HttpError(
        400,
        ERROR_MSG.REFERENCE_CHAIN_TOO_DEEP,
        'REFERENCE_CHAIN_TOO_DEEP',
      )
    }

    const refTarget = refMap.get(id)

    if (refTarget) {
      return resolve(refTarget, depth + 1)
    }

    const override = overrideMap.get(id)
    if (override !== null && override !== undefined) {
      return override
    }

    return defaultMap.get(id) ?? null
  }

  for (const id of schemaFieldIds) {
    result.set(id, resolve(id))
  }

  return result
}