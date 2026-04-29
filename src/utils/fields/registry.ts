import { FieldName, FieldValidationType } from '@/types/field'
import type { ValidationStrategy } from './types'
import {
    validateStandardText,
    validateConfirmPassword,
    validateEmail,
    validateDefaultValue,
} from './strategies'

export type FieldStrategyMap = {
    [key in FieldValidationType]?: ValidationStrategy
} & {
    default?: ValidationStrategy
}

const extensiveTextValidationMap: FieldStrategyMap = {
    [FieldValidationType.Submit]: validateStandardText,
    [FieldValidationType.UserCreation]: validateStandardText,
    [FieldValidationType.PasswordSetup]: validateStandardText,
    [FieldValidationType.ProfileUpdate]: validateStandardText,
    [FieldValidationType.FieldCreation]: validateStandardText,
}

const emailValidationMap: FieldStrategyMap = {
    [FieldValidationType.Submit]: validateEmail,
    [FieldValidationType.UserCreation]: validateEmail,
}

const strategyRegistry: Partial<Record<FieldName | string, FieldStrategyMap>> = {
    [FieldName.Name]: extensiveTextValidationMap,
    [FieldName.Username]: extensiveTextValidationMap,
    [FieldName.Password]: extensiveTextValidationMap,
    [FieldName.KeyName]: extensiveTextValidationMap,

    [FieldName.ConfirmPassword]: {
        default: validateConfirmPassword,
    },

    [FieldName.Email]: emailValidationMap,

    [FieldName.DefaultValue]: {
        [FieldValidationType.FieldCreation]: validateDefaultValue,
    },
}

export const getValidationStrategy = (
    fieldName: string,
    validationType: FieldValidationType
): ValidationStrategy | undefined => {
    const fieldStrategies = strategyRegistry[fieldName]

    if (!fieldStrategies) return undefined

    return fieldStrategies[validationType] ?? fieldStrategies.default
}