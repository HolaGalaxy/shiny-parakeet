export enum FieldValidationType {
  Login = 'Login',
  Submit = 'Submit',
  SchemaCreation = 'SchemaCreation',
  FieldCreation = 'FieldCreation',
  UserCreation = 'UserCreation',
  PasswordSetup = 'PasswordSetup',
  ProfileUpdate = 'ProfileUpdate',
}

export enum FieldType {
  Text = 'text',
  Password = 'password',
  Email = 'email',
  Textarea = 'textarea',
  Select = 'select',
}

export enum FieldName {
  Name = 'name',
  Password = 'password',
  ConfirmPassword = 'confirmPassword',
  Email = 'email',
  Description = 'description',
  Type = 'type',
  Value = 'value',
  Role = 'role',
  Username = 'username',
  DefaultValue = 'defaultValue',
  KeyName = 'keyName',
  Feature = 'Feature',
  FeatureKey = 'FeatureKey',
  Key = 'key',
}

export enum FieldVariant {
  Default = 'default',
  Gray = 'gray',
  Info = 'info',
  Failure = 'failure',
  Warning = 'warning',
  Success = 'success',
}

export type SelectOption = {
  id: string
  label: string
  value: string | number
}

export type Field = {
  index: number
  xs?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
  label: string
  name: FieldName
  type: FieldType
  placeholder?: string
  required: boolean
  error?: boolean
  value: string | SelectOption
  errors?: string[]
  errorIdx?: number
  maxLength?: number
  minLength?: number
  variant?: FieldVariant
  rows?: number
  className?: string
  options?: SelectOption[]
  disabled?: boolean
}
