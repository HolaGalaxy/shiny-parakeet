import { Field, FieldName } from '@/types/field'
import { extractFieldValue } from './type-guards'

export function constructPayloadFromFields<T extends Record<string, string>>(
  fields: Field[],
  mapping: Partial<Record<FieldName, keyof T>>,
): Partial<T> {
  const payload = {} as Partial<T>
  for (const field of fields) {
    switch (field.name) {
      default:
        const targetKey = mapping[field.name]
        if (targetKey !== undefined) {
          (payload as Record<string, string>)[targetKey as string] = extractFieldValue(field.value)
        }
        break
    }
  }
  return payload
}
