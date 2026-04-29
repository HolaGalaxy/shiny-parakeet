import { type Field, FieldName, FieldType, FieldVariant } from '@/types/field'

export type CreateFieldPayload = { name: string; valueType: string; defaultValue: string }

export const FIELD_CREATION_MAPPING: Partial<Record<FieldName, keyof CreateFieldPayload>> = {
  [FieldName.KeyName]: 'name',
  [FieldName.Type]: 'valueType',
  [FieldName.DefaultValue]: 'defaultValue',
}

export enum FieldValueTypes {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
}

export const fieldCreationFields: Field[] = [
  {
    index: 0, xs: 6, label: 'Field Name', name: FieldName.KeyName, type: FieldType.Text,
    placeholder: 'Enter field name', required: true, error: false, value: '', maxLength: 128,
    errors: ['Field name is required.', 'Max length is 128 characters.', 'Only lowercase letters, numbers and underscores are allowed.'], variant: FieldVariant.Default,
  },
  {
    index: 1, xs: 6, label: 'Field Type', name: FieldName.Type, type: FieldType.Select,
    placeholder: 'Select field type', required: true, error: false, value: '',
    options: [
      { id: 'STRING', label: 'String', value: 'STRING' },
      { id: 'NUMBER', label: 'Number', value: 'NUMBER' },
      { id: 'BOOLEAN', label: 'Boolean', value: 'BOOLEAN' },
      { id: 'ARRAY', label: 'Array', value: 'ARRAY' },
      { id: 'OBJECT', label: 'Object', value: 'OBJECT' },
    ],
    errors: ['Field type is required.'], variant: FieldVariant.Default,
  },
  {
    index: 2, xs: 12, label: 'Default Value', name: FieldName.DefaultValue, type: FieldType.Textarea,
    placeholder: 'Enter default value', required: true, error: false, value: '',
    variant: FieldVariant.Default, className: 'mt-0',
    errors: [
      'Value is required.',
      'Value must be a valid number.',
      'Value  must be a valid boolean.',
      'Value must be a valid array.',
      'Value must be a valid object.',
    ],
  },
]
