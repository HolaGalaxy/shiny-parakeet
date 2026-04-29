import { Field, FieldName, FieldType, FieldVariant } from "@/types/field";

export const existingFields: Field[] = [
    {
        index: 0,
        xs: 3,
        label: 'Key',
        name: FieldName.Key,
        type: FieldType.Select,
        placeholder: 'Select a key',
        required: true,
        value: '',
        errors: ['key is required.'],
        variant: FieldVariant.Default,
        options: []
    },
    {
        index: 1,
        xs: 4,
        label: 'Feature',
        name: FieldName.Feature,
        type: FieldType.Select,
        placeholder: 'Select a feature',
        required: true,
        error: true,
        value: '',
        errors: ['feature is required.'],
        variant: FieldVariant.Default,
        options:[]
    },
    {
        index: 2,
        xs: 4,
        label: 'Feature Key',
        name: FieldName.FeatureKey,
        type: FieldType.Select,
        placeholder: 'Select a feature key',
        required: true,
        error: true,
        value: '',
        errors: ['feature key is required.'],
        variant: FieldVariant.Default,
        options: [],
        disabled: true,
    },
]