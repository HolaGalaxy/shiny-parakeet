import { NextRequest } from 'next/server'
import { jsonError, jsonOk } from '@/lib/http/http-error'
import { FeatureService } from '@/services/feature.service'

type Params = { featureName: string }

export async function GET(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const { featureName } = await context.params
    const data = await FeatureService.getPublicFeature(featureName)
    return jsonOk(data)
  } catch (e: unknown) {
    return jsonError(e)
  }
}
