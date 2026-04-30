import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth/require-session'
import { jsonError, jsonOk } from '@/lib/http/http-error'
import { SchemaService } from '@/services/schema.service'

type Params = { schemaName: string }

export async function GET(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    await requireSession()
    const { schemaName } = await context.params
    const schema = await SchemaService.getDetail(schemaName)
    return jsonOk({ schema })
  } catch (e: unknown) {
    return jsonError(e)
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const session = await requireSession()
    const { schemaName } = await context.params
    await SchemaService.delete(session, schemaName)
    return jsonOk({ ok: true })
  } catch (e: unknown) {
    return jsonError(e)
  }
}
