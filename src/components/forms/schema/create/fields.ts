import { type ButtonT, ButtonType } from '@/types/button'
import { type Field, FieldName, FieldType, FieldVariant } from '@/types/field'

export const fields: Field[] = [
  {
    index: 0,
    xs: 6,
    label: 'Schema Name',
    name: FieldName.Name,
    type: FieldType.Text,
    placeholder: 'Enter your schema name',
    required: true,
    error: false,
    value: '',
    variant: FieldVariant.Default,
  },
  {
    index: 1,
    xs: 6,
    label: 'Schema Description',
    name: FieldName.Description,
    type: FieldType.Textarea,
    placeholder: 'Enter your schema description',
    required: false,
    error: false,
    value: '',
    variant: FieldVariant.Default,
    rows: 3,
    className: 'mt-0',
  },
]

export const buttons: ButtonT[] = [
  { label: 'Save', name: 'save', type: ButtonType.Submit },
  { label: 'Cancel', name: 'cancel', type: ButtonType.Button, variant: 'destructive', className: 'rounded-full' },
]
