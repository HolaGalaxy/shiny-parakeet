import type { FieldValueType } from '@prisma/client'

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue }

export type ResolvedFeatureField = {
    schemaFieldId: string
    name: string
    valueType: FieldValueType
    defaultValue: JsonValue
    effectiveValue: JsonValue
    hasOverride: boolean
    createdAt: Date
    featureId: string | null
}

export type ResolvedFeature = {
    featureId: string
    featureName: string
    description: string
    fields: ResolvedFeatureField[]
    createdAt: Date
    updatedAt: Date
    schemaId: string
    schemaName: string
}

export type ResolvedFeaturesResponse = {
    features: ResolvedFeature[]
}

export type ReferencePayload = {
    consumerSchemaFieldId: string
    targetFeatureId: string
    targetSchemaFieldId: string
}