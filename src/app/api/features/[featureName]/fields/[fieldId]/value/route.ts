import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth/require-session'
import { jsonError, jsonOk } from '@/lib/http/http-error'
import { parseAndValidate } from '@/lib/http/parse-json-body'
import { FeatureService, patchFieldValueInput } from '@/services/feature.service'

type Params = { featureName: string; fieldId: string }

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const session = await requireSession()
    const { featureName, fieldId } = await context.params
    const input = await parseAndValidate(request, patchFieldValueInput)
    const result = await FeatureService.updateFieldValue(session, featureName, fieldId, input)
    return jsonOk(result)
  } catch (e: unknown) {
    return jsonError(e)
  }
}
