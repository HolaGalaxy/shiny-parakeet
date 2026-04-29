import { FieldValueTypes } from '@/components/forms/schema/fields/fields'

/**
 * Converts a raw text input into a native JSON value based on the declared valueType.
 * STRING values are returned as-is (no JSON.parse needed — they're already strings).
 * For all other types, JSON.parse is used so the API receives native JSON.
 *
 * Returns `{ ok: true, value }` on success, `{ ok: false, error }` on failure.
 */
export function parseFormValueToJson( valueType: string, raw: string ): { ok: true; value: unknown } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (trimmed === '') return { ok: true, value: null }

  switch (valueType as FieldValueTypes) {
    case FieldValueTypes.STRING:
      return { ok: true, value: trimmed }

    case FieldValueTypes.NUMBER: {
      const num = Number(trimmed)
      if (Number.isNaN(num)) return { ok: false, error: 'Value must be a valid number' }
      return { ok: true, value: num }
    }

    case FieldValueTypes.BOOLEAN: {
      const lower = trimmed.toLowerCase()
      if (lower !== 'true' && lower !== 'false') {
        return { ok: false, error: 'Value must be true or false' }
      }
      return { ok: true, value: lower === 'true' }
    }

    case FieldValueTypes.ARRAY: {
      try {
        const parsed: unknown = JSON.parse(trimmed)
        if (!Array.isArray(parsed)) return { ok: false, error: 'Value must be a valid JSON array' }
        return { ok: true, value: parsed }
      } catch {
        return { ok: false, error: 'Value must be valid JSON' }
      }
    }

    case FieldValueTypes.OBJECT: {
      try {
        const parsed: unknown = JSON.parse(trimmed)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          return { ok: false, error: 'Value must be a valid JSON object' }
        }
        return { ok: true, value: parsed }
      } catch {
        return { ok: false, error: 'Value must be valid JSON' }
      }
    }

    default:
      return { ok: true, value: trimmed }
  }
}

/**
 * Serializes any JSON value to a display string using JSON.stringify.
 * Always produces a consistent representation regardless of type.
 */
export function jsonToDisplayString(value: unknown): string {
  if (value === null || value === undefined) return '—'
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
