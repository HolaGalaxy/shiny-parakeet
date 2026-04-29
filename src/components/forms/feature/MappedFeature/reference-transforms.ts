import type { FeatureFieldsResponse } from '@/types/feature'
import { type Field, FieldName } from '@/types/field'
import { existingFields } from './reference-fields'
import type { ReferencePayload, ResolvedFeaturesResponse } from './reference-types'

export function buildExistingFieldRows(
    data?: FeatureFieldsResponse,
    featuresData?: ResolvedFeaturesResponse,
): Field[][] {
    const fields = data?.fields ?? []
    const refFields = fields.filter((f) => f.reference)

    return refFields.map((refField, index) =>
        structuredClone(existingFields).map((base) => {
            const field = { ...base, index: base.index + index }

            switch (base.name) {
                case FieldName.Key:
                    field.value = refField.schemaFieldId
                    field.disabled = true
                    field.options = fields.map((f) => ({ id: f.schemaFieldId, label: f.name, value: f.schemaFieldId }))
                    break

                case FieldName.Feature:
                    field.value = refField.reference?.targetFeatureId ?? ''
                    field.options = (featuresData?.features.map((f) => ({ id: f.featureId, label: f.featureName, value: f.featureId })) ?? []).filter((f) => f.id !== data?.featureId)
                    break

                case FieldName.FeatureKey: {
                    const selected = featuresData?.features.find((f) => f.schemaName === refField.reference?.targetSchemaName,)
                    field.value = refField.reference?.targetSchemaFieldId ?? ''
                    field.disabled = false
                    field.options = selected?.fields.map((f) => ({ id: f.schemaFieldId, label: f.name, value: f.schemaFieldId })) ?? []
                    break
                }
            }
            return field
        }),
    )
}

export function buildEmptyMappingRow(
    rowIndex: number,
    data?: FeatureFieldsResponse,
    featuresData?: ResolvedFeaturesResponse,
): Field[] {
    return existingFields.map((fld) => {
        const field = { ...fld, index: fld.index + rowIndex }

        if (fld.name === FieldName.Key) {
            return {
                ...field, value: '', disabled: false,
                options: data?.fields.map((f) => ({ id: f.schemaFieldId, label: f.name, value: f.schemaFieldId })),
            }
        }

        if (fld.name === FieldName.Feature) {
            return {
                ...field, value: '', disabled: false, options: (featuresData?.features.map((f) => ({ id: f.featureId, label: f.featureName, value: f.featureId })) ?? []).filter((f) => f.id !== data?.featureId),
            }
        }

        return field
    })
}

export function buildReferencePayload(
    rows: Field[][],
): Partial<ReferencePayload>[] {
    return rows.map((row) => {
        const key = row.find((f) => f.name === FieldName.Key)
        const feature = row.find((f) => f.name === FieldName.Feature)
        const featureKey = row.find((f) => f.name === FieldName.FeatureKey)

        return {
            consumerSchemaFieldId: key?.value as string,
            targetFeatureId: feature?.value as string,
            targetSchemaFieldId: featureKey?.value as string,
        }
    })
}

export function findDuplicateKeys(rows: Field[][]): boolean {
    const keyValues = rows
        .map((row) => row.find((f) => f.name === FieldName.Key)?.value as string)
        .filter(Boolean)

    return keyValues.length !== new Set(keyValues).size
}

export function applyValidationToRows(
    rows: Field[][],
    validatedFlat: Field[],
): Field[][] {
    let offset = 0
    return rows.map((row) => {
        const chunk = validatedFlat.slice(offset, offset + row.length)
        offset += row.length
        return chunk
    })
}