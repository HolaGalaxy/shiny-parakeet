import { requireSession } from '@/lib/auth/require-session'
import { jsonError, jsonOk } from '@/lib/http/http-error'
import { FeatureService } from '@/services/feature.service'

export async function GET() {
  try {
    await requireSession()
    const features = await FeatureService.list()
    return jsonOk({ features })
  } catch (e: unknown) {
    return jsonError(e)
  }
}
