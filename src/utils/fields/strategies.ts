import { FieldName } from '@/types/field'
import { FieldValueTypes } from '@/components/forms/schema/fields/fields'
import { extractFieldValue } from '../type-guards' // Adjust path as needed
import { parseFormValueToJson } from '@/utils/json'
import { REGEX } from './constants'
import type { ValidationStrategy } from './types'

export const validateStandardText: ValidationStrategy = ({ field, trimmedVal }) => {
  const meetsMin = field.minLength === undefined || trimmedVal.length >= field.minLength
  const meetsMax = field.maxLength === undefined || trimmedVal.length <= field.maxLength

  if (!meetsMin || !meetsMax) return { error: true, errorIdx: 1 }

  if (field.name === FieldName.KeyName && !REGEX.IDENTIFIER.test(trimmedVal)) {
    return { error: true, errorIdx: 2 }
  }

  return null 
}

export const validateConfirmPassword: ValidationStrategy = ({ rawVal, allFields }) => {
  const passwordField = allFields.find((f) => f.name === FieldName.Password)
  const passwordVal = passwordField ? extractFieldValue(passwordField.value) : ''

  if (rawVal !== passwordVal) return { error: true, errorIdx: 1 }
  
  return null
}

export const validateEmail: ValidationStrategy = ({ trimmedVal }) => {
  if (!REGEX.EMAIL.test(trimmedVal)) return { error: true, errorIdx: 1 }
  
  return null
}

export const validateDefaultValue: ValidationStrategy = ({ trimmedVal, allFields }) => {
  const typeField = allFields.find((f) => f.name === FieldName.Type)
  const typeVal = typeField ? extractFieldValue(typeField.value) : ''

  if (!typeVal) return null

  const result = parseFormValueToJson(typeVal, trimmedVal)
  
  if (!result.ok) {
    const errorIdxMap: Record<string, number> = {
      [FieldValueTypes.NUMBER]: 1,
      [FieldValueTypes.BOOLEAN]: 2,
      [FieldValueTypes.ARRAY]: 3,
      [FieldValueTypes.OBJECT]: 4,
    }
    return { error: true, errorIdx: errorIdxMap[typeVal] ?? 0 }
  }
  
  return null
}