import { type Field, FieldValidationType } from '@/types/field'

export interface ValidationResult {
  updatedFields: Field[]
  hasError: boolean
}

export interface ValidationState {
  error: boolean
  errorIdx?: number
}

export interface ValidationContext {
  field: Field
  rawVal: string
  trimmedVal: string
  isEmpty: boolean
  validationType: FieldValidationType
  allFields: Field[]
}

export type ValidationStrategy = (ctx: ValidationContext) => ValidationState | null