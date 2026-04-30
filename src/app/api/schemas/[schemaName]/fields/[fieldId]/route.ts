import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth/require-session'
import { jsonError, jsonOk } from '@/lib/http/http-error'
import { SchemaFieldService } from '@/services/schema-field.service'

type Params = { schemaName: string; fieldId: string }

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const session = await requireSession()
    const { schemaName, fieldId } = await context.params
    const result = await SchemaFieldService.delete(session, schemaName, fieldId)
    return jsonOk(result)
  } catch (e: unknown) {
    return jsonError(e)
  }
}
