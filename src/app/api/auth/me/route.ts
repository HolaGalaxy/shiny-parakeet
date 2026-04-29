import { requireSession } from '@/lib/auth/require-session'
import { jsonError, jsonOk } from '@/lib/http/http-error'

export async function GET() {
  try {
    const session = await requireSession()
    return jsonOk({ user: session })
  } catch (e: unknown) {
    return jsonError(e)
  }
}
