import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth/require-session'
import { jsonError, jsonOk } from '@/lib/http/http-error'
import { parseAndValidate } from '@/lib/http/parse-json-body'
import { SchemaFieldService, createFieldInput } from '@/services/schema-field.service'
import { HttpStatus } from '@/constants/http'

type Params = { schemaName: string }

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const session = await requireSession()
    const { schemaName } = await context.params
    const input = await parseAndValidate(request, createFieldInput)
    const field = await SchemaFieldService.create(session, schemaName, input)
    return jsonOk({ field }, HttpStatus.CREATED)
  } catch (e: unknown) {
    return jsonError(e)
  }
}
