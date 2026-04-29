import { NextResponse } from 'next/server'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import type { ActionErrorResponse } from '@/types/action'
import { isHttpError } from '@/utils/type-guards'

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function jsonError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code ?? 'HTTP_ERROR',
          details: error.details,
        },
      },
      { status: error.status },
    )
  }

  console.error('[api] unhandled error', error)
  return NextResponse.json(
    { error: { message: ERROR_MSG.INTERNAL, code: 'INTERNAL' } },
    { status: HttpStatus.INTERNAL },
  )
}

export function jsonOk<T>(data: T, init?: number | ResponseInit): NextResponse {
  const status =
    typeof init === 'number' ? init : (init as ResponseInit | undefined)?.status ?? HttpStatus.OK
  const rest = typeof init === 'object' ? init : {}
  return NextResponse.json(data, { ...rest, status })
}

export function handleActionError(error: unknown): ActionErrorResponse {
  if (isHttpError(error)) {
    const httpErr = error as HttpError
    return { success: false, error: httpErr.message, code: httpErr.status }
  }
  console.error('[action] unhandled error', error)
  return { success: false, error: ERROR_MSG.INTERNAL, code: HttpStatus.INTERNAL }
}
