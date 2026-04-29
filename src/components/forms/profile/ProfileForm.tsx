'use client'

import CardBox from '@/components/shared/CardBox'
import { GetFieldWithGridItem, GridContainer } from '@/components/compounds/Grid'
import { Button } from '@/components/ui/button'
import { type Field, FieldName, FieldType, FieldValidationType, FieldVariant } from '@/types/field'
import type { ProfileData } from '@/types/profile'
import { validateAndUpdateFields, ValidateFields } from '@/utils/fields'
import { extractFieldValue } from '@/utils/type-guards'
import { successToast, errorToast } from '@/utils/toast'
import { Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { updateProfileAction } from '@/server/actions/profile'
import { formatRole } from '@/utils/format'

type Props = { profile: ProfileData }

function buildFields(profile: ProfileData): Field[] {
  return [
    { index: 0, xs: 6, label: 'Full Name', name: FieldName.Name, type: FieldType.Text, placeholder: 'Enter your name', required: true, error: false, value: profile.name ?? '', errors: ['Name is required.'], variant: FieldVariant.Default },
    { index: 1, xs: 6, label: 'Email', name: FieldName.Email, type: FieldType.Email, placeholder: '', required: false, error: false, value: profile.email, variant: FieldVariant.Default, disabled: true },
    { index: 2, xs: 6, label: 'Username', name: FieldName.Username, type: FieldType.Text, placeholder: '', required: false, error: false, value: profile.username, variant: FieldVariant.Default, disabled: true },
    { index: 3, xs: 6, label: 'Role', name: FieldName.Role, type: FieldType.Text, placeholder: '', required: false, error: false, value: formatRole(profile.role), variant: FieldVariant.Default, disabled: true },
  ]
}

export default function ProfileForm({ profile }: Props) {
  const [fieldsState, setFieldsState] = useState<Field[]>(buildFields(profile))
  const [isPending, startTransition] = useTransition()

  const onHandleInputChange = (name: FieldName, value: string, field: Field) => {
    const { updatedFields } = validateAndUpdateFields(fieldsState, FieldValidationType.ProfileUpdate, field, value)
    setFieldsState(updatedFields)
  }

  const onHandleSubmit = () => {
    const { hasError, updatedFields } = ValidateFields(fieldsState, FieldValidationType.ProfileUpdate)
    if (hasError) {
      setFieldsState(updatedFields)
      return
    }

    const nameField = updatedFields.find((f) => f.name === FieldName.Name)
    const nameValue = nameField ? extractFieldValue(nameField.value) : ''

    startTransition(async () => {
      const result = await updateProfileAction({ name: nameValue })
      if (result.success) {
        successToast('Profile updated successfully')
      } else {
        errorToast(result.error)
      }
    })
  }

  return (
    <CardBox>
      <h2 className='text-lg font-semibold mb-2'>My Profile</h2>

      <div className='bg-lightgray dark:bg-gray-800/70 p-6 rounded-md'>
        <GridContainer spacing={6}>
          {fieldsState.map((field) => (
            <GetFieldWithGridItem key={field.name} field={field} onUpdate={onHandleInputChange} />
          ))}
        </GridContainer>
      </div>

      <div className='flex gap-3'>
        <Button onClick={onHandleSubmit} className='rounded-full' disabled={isPending}>
          {isPending ? <Loader2 className='w-4 h-4 animate-spin' /> : null}
          Save Changes
        </Button>
      </div>

      <div className='text-xs text-muted-foreground mt-4'>
        Member since {new Date(profile.createdAt).toLocaleDateString()}
      </div>
    </CardBox>
  )
}
