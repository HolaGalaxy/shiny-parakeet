'use client'

import CardBox from '@/components/shared/CardBox'
import { GetFieldWithGridItem, GridContainer } from '@/components/compounds/Grid'
import { Button } from '@/components/ui/button'
import { type ButtonT, ButtonType, type ButtonVariant } from '@/types/button'
import { type Field, FieldName, FieldValidationType } from '@/types/field'
import { validateAndUpdateFields, ValidateFields } from '@/utils/fields'
import { constructPayloadFromFields } from '@/utils/payload'
import { successToast, errorToast } from '@/utils/toast'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { buttons, fields } from './fields'
import { createUserAction } from '@/server/actions/user'
import { ROUTES } from '@/constants/routes'
import { Loader2 } from 'lucide-react'

type CreateUserPayload = { name: string; email: string; username: string; role: string }

const USER_FIELD_MAPPING: Partial<Record<FieldName, keyof CreateUserPayload>> = {
  [FieldName.Name]: 'name',
  [FieldName.Email]: 'email',
  [FieldName.Username]: 'username',
  [FieldName.Role]: 'role',
}

export default function CreateUserForm() {
  const router = useRouter()
  const [fieldsState, setFieldsState] = useState<Field[]>(structuredClone(fields))
  const [isPending, startTransition] = useTransition()

  const onHandleInputChange = (name: FieldName, value: string, field: Field) => {
    const { updatedFields } = validateAndUpdateFields(fieldsState, FieldValidationType.UserCreation, field, value)
    setFieldsState(updatedFields)
  }

  const onHandleButtonClick = (button: ButtonT) => {
    if (button.type === ButtonType.Submit) onHandleSubmit()
    else router.push(ROUTES.USERS)
  }

  const onHandleSubmit = () => {
    const { hasError, updatedFields } = ValidateFields(fieldsState, FieldValidationType.UserCreation)
    if (hasError) {
      setFieldsState(updatedFields)
      return
    }

    startTransition(async () => {
      const payload = constructPayloadFromFields<CreateUserPayload>(updatedFields, USER_FIELD_MAPPING)
      const result = await createUserAction(payload)

      if (!result.success) {
        errorToast(result.error)
        return
      }

      successToast('User created! Send the verification link to complete setup.')
      router.push(ROUTES.USERS)
    })
  }

  return (
    <CardBox>
      <div className='flex items-center gap-2'>
        <Icon icon='tabler:arrow-back-up' height='24' className='cursor-pointer' onClick={() => router.push(ROUTES.USERS)} />
        <h2 className='text-lg font-semibold'>Add New User</h2>
      </div>

      <div className='bg-lightgray dark:bg-gray-800/70 p-6 rounded-md'>
        <GridContainer spacing={6}>
          {fieldsState.map((field) => (
            <GetFieldWithGridItem key={field.name} field={field} onUpdate={onHandleInputChange} />
          ))}
        </GridContainer>
      </div>

      <div className='flex gap-3'>
        {buttons.map((button) => (
          <Button key={button.name} onClick={() => onHandleButtonClick(button)} className={button.className} variant={button.variant as ButtonVariant} disabled={isPending && button.type === ButtonType.Submit}>
            {isPending && button.type === ButtonType.Submit ? <Loader2 className='w-4 h-4 animate-spin' /> : null}
            {button.label}
          </Button>
        ))}
      </div>
    </CardBox>
  )
}
