import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth/require-session'
import { jsonError, jsonOk } from '@/lib/http/http-error'
import { parseAndValidate } from '@/lib/http/parse-json-body'
import { ReferenceService, syncReferencesInput } from '@/services/reference.service'

type Params = { featureName: string }

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const session = await requireSession()
    const { featureName } = await context.params
    const input = await parseAndValidate(request, syncReferencesInput)
    const result = await ReferenceService.sync(session, featureName, input)
    return jsonOk(result)
  } catch (e: unknown) {
    return jsonError(e)
  }
}
