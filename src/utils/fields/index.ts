import { type Field, FieldType, FieldValidationType, FieldVariant } from '@/types/field'
import { extractFieldValue } from '../type-guards' 
import { getValidationStrategy } from './registry'
import type { ValidationResult, ValidationState, ValidationContext } from './types'


export const validateAndUpdateFields = (fields: Field[], validationType: FieldValidationType, targetField: Field, value: string, additionalData?: any): ValidationResult => {
    let globalHasError = false

    const updatedFields = fields.map((fld) => {
        const isTarget = fld.name === targetField.name && fld.index === targetField.index
        if (!isTarget) {
            if (fld.error) globalHasError = true
            return fld
        }

        const fieldToValidate = { ...fld, value }
        const state = computeFieldState(fieldToValidate, validationType, fields)
        if (state.error) globalHasError = true

        return applyState(fieldToValidate, state)
    })

    return { updatedFields, hasError: globalHasError }
}

export const ValidateFields = (
    fields: Field[],
    validationType: FieldValidationType,
): ValidationResult => {
    let globalHasError = false

    const updatedFields = fields.map((fld) => {
        const state = computeFieldState(fld, validationType, fields)
        if (state.error) globalHasError = true
        return applyState(fld, state)
    })

    return { updatedFields, hasError: globalHasError }
}


const computeFieldState = (field: Field, validationType: FieldValidationType, allFields: Field[]): ValidationState => {
    const hasErrorMessages = Array.isArray(field.errors) && field.errors.length > 0
    if (!hasErrorMessages) return { error: false }

    const rawVal = extractFieldValue(field.value)
    const trimmedVal = rawVal.trim()
    const isEmpty = trimmedVal.length === 0

    if (isEmpty && field.required) return { error: true, errorIdx: 0 }

    if (isEmpty) return { error: false }
    if (field.type === FieldType.Select) return { error: false }

    const strategy = getValidationStrategy(field.name, validationType)
    if (strategy) {
        const context: ValidationContext = { field, rawVal, trimmedVal, isEmpty, validationType, allFields }
        const strategyResult = strategy(context)
        if (strategyResult) return strategyResult
    }

    return { error: false }
}

const applyState = (field: Field, state: ValidationState): Field => ({
    ...field,
    error: state.error,
    errorIdx: state.errorIdx,
    variant: state.error ? FieldVariant.Failure : FieldVariant.Default,
})