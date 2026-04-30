import { NextRequest } from 'next/server'
import { type ZodSchema } from 'zod'
import { HttpError } from './http-error'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'

export async function parseJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.INVALID_JSON, 'INVALID_JSON')
  }
}

export async function parseAndValidate<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
): Promise<T> {
  const json = await parseJsonBody(request)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    throw new HttpError(
      HttpStatus.BAD_REQUEST,
      ERROR_MSG.VALIDATION_FAILED,
      'VALIDATION',
      parsed.error.flatten(),
    )
  }
  return parsed.data
}
