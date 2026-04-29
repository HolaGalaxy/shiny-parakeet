import { NextRequest } from 'next/server'
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
    const { featureName } = await context.params

    const schema = await prisma.schema.findUnique({
      where: { name: featureName },
      include: { fields: { orderBy: { createdAt: 'asc' } }, feature: true },
    })

    if (!schema || !schema.feature) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.FEATURE_NOT_FOUND, 'NOT_FOUND')
    }

    const fieldIds = schema.fields.map((f) => f.id)
    const effectiveMap = await resolveEffectiveJsonValues(fieldIds)

    const fields: Record<string, unknown> = {}
    for (const f of schema.fields) {
      fields[f.name] = effectiveMap.get(f.id) ?? f.defaultValue
    }

    return jsonOk({
      feature: schema.name,
      schemaId: schema.id,
      fields,
    })
  } catch (e: unknown) {
    return jsonError(e)
  }
}
