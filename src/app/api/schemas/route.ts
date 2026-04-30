import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth/require-session'
import { jsonError, jsonOk } from '@/lib/http/http-error'
import { parseAndValidate } from '@/lib/http/parse-json-body'
import { SchemaService, createSchemaInput } from '@/services/schema.service'
import { HttpStatus } from '@/constants/http'

export async function GET() {
  try {
    await requireSession()
    const schemas = await SchemaService.list()
    return jsonOk({ schemas })
  } catch (e: unknown) {
    return jsonError(e)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    const input = await parseAndValidate(request, createSchemaInput)
    const result = await SchemaService.create(session, input)
    return jsonOk({ schema: result }, HttpStatus.CREATED)
  } catch (e: unknown) {
    return jsonError(e)
  }
}
