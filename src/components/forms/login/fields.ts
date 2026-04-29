import { type Field, FieldName, FieldType, FieldVariant } from '@/types/field'

export const loginFields: Field[] = [
  {
    index: 0,
    xs: 12,
    label: 'Email',
    name: FieldName.Email,
    type: FieldType.Email,
    placeholder: 'Enter your email',
    required: true,
    error: true,
    value: '',
    errors: ['email is required.', 'email is invalid.'],
    variant: FieldVariant.Default,
  },
  {
    index: 1,
    xs: 12,
    label: 'Password',
    name: FieldName.Password,
    type: FieldType.Password,
    placeholder: 'Enter your password',
    required: true,
    error: false,
    errors: ['Password is required.', 'Password must be between 6 and 32 characters.'],
    value: '',
    minLength: 6,
    maxLength: 32,
    variant: FieldVariant.Default,
  },
]
