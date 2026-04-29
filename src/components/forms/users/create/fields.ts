import { type ButtonT, ButtonType } from '@/types/button'
import { type Field, FieldName, FieldType, FieldVariant } from '@/types/field'

export const fields: Field[] = [
  {
    index: 0, xs: 6, label: 'Full Name', name: FieldName.Name, type: FieldType.Text,
    placeholder: 'Enter full name', required: true, error: false, value: '',
    errors: ['Name is required.', 'Name must be between 1 and 256 characters.'],
    variant: FieldVariant.Default, minLength: 1, maxLength: 256,
  },
  {
    index: 1, xs: 6, label: 'Email', name: FieldName.Email, type: FieldType.Email,
    placeholder: 'Enter email address', required: true, error: false, value: '',
    errors: ['Email is required.', 'Email is invalid.'], variant: FieldVariant.Default,
  },
  {
    index: 2, xs: 6, label: 'Username', name: FieldName.Username, type: FieldType.Text,
    placeholder: 'Enter username (e.g. john.doe)', required: true, error: false, value: '',
    errors: ['Username is required.', 'Username must be between 1 and 128 characters.'],
    variant: FieldVariant.Default, minLength: 1, maxLength: 128,
  },
  {
    index: 3, xs: 6, label: 'Role', name: FieldName.Role, type: FieldType.Select,
    placeholder: 'Select a role', required: true, error: false, value: '',
    options: [
      { id: 'ADMIN', label: 'Admin', value: 'ADMIN' },
      { id: 'READ_WRITE', label: 'Read / Write', value: 'READ_WRITE' },
      { id: 'READ_ONLY', label: 'Read Only', value: 'READ_ONLY' },
    ],
    errors: ['Role is required.'], variant: FieldVariant.Default,
  },
]

export const buttons: ButtonT[] = [
  { label: 'Create & Send Invite', name: 'save', type: ButtonType.Submit },
  { label: 'Cancel', name: 'cancel', type: ButtonType.Button, variant: 'destructive', className: 'rounded-full' },
]
