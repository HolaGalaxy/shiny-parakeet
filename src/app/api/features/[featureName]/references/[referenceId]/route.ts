import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth/require-session'
import { jsonError, jsonOk } from '@/lib/http/http-error'
import { ReferenceService } from '@/services/reference.service'

type Params = { featureName: string; referenceId: string }

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const session = await requireSession()
    const { featureName, referenceId } = await context.params
    const result = await ReferenceService.deleteReference(session, featureName, referenceId)
    return jsonOk(result)
  } catch (e: unknown) {
    return jsonError(e)
  }
}
