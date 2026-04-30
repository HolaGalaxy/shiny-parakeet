import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth/require-session'
import { jsonError, jsonOk } from '@/lib/http/http-error'
import { FeatureService } from '@/services/feature.service'

type Params = { featureName: string }

export async function GET(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    await requireSession()
    const { featureName } = await context.params
    const data = await FeatureService.getFields(featureName)
    return jsonOk(data)
  } catch (e: unknown) {
    return jsonError(e)
  }
}
