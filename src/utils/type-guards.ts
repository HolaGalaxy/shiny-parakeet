import type { HttpError } from '@/lib/http/http-error'
import type { SelectOption } from '@/types/field'

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function extractFieldValue(value: string | SelectOption): string {
  return isString(value) ? value : value?.value?.toString() ?? ''
}

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}

export function isHttpError(error: unknown): error is HttpError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name: string }).name === 'HttpError'
  )
}

export function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  )
}

export function isRecordStringUnknown(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
