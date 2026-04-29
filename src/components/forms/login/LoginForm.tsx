'use client'

import FullLogo from '@/components/layout/FullLogo'
import { GetFieldWithGridItem, GridContainer } from '@/components/compounds/Grid'
import { Button } from '@/components/ui/button'
import { type Field, FieldName, FieldValidationType } from '@/types/field'
import type { LoginPayload } from '@/types/auth'
import { constructPayloadFromFields } from '@/utils/payload'
import { errorToast } from '@/utils/toast'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import CardBox from '@/components/shared/CardBox'
import { loginFields } from './fields'
import { loginAction } from '@/server/actions/auth'
import { ROUTES } from '@/constants/routes'
import { validateAndUpdateFields, ValidateFields } from '@/utils/fields'

const LOGIN_FIELD_MAPPING: Partial<Record<FieldName, keyof LoginPayload>> = {
  [FieldName.Email]: 'email',
  [FieldName.Password]: 'password',
}

export const LoginForm = () => {
  const [fields, setFields] = useState<Field[]>(structuredClone(loginFields))
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const onHandleInputChange = (name: FieldName, value: string, field: Field) => {
    const { updatedFields } = validateAndUpdateFields(fields, FieldValidationType.Login, field, value)
    setFields(updatedFields)
  }

  const onHandleSubmit = () => {
    const { hasError, updatedFields } = ValidateFields(fields, FieldValidationType.Submit)
    if (hasError) {
      setFields(updatedFields)
      return
    }

    startTransition(async () => {
      const payload = constructPayloadFromFields<LoginPayload>(updatedFields, LOGIN_FIELD_MAPPING)
      const result = await loginAction(payload)

      if (!result.success) {
        errorToast(result.error)
        return
      }

      router.refresh()
      router.push(ROUTES.SCHEMAS)
    })
  }

  return (
    <div className='h-screen w-full flex justify-center items-center bg-lightprimary'>
      <div className='md:min-w-[450px] min-w-max'>
        <CardBox>
          <div className='flex justify-center mb-4'>
            <FullLogo />
          </div>

          <GridContainer spacing={6}>
            {fields.map((field) => (
              <GetFieldWithGridItem key={field.name} field={field} onUpdate={onHandleInputChange} />
            ))}
          </GridContainer>

          <Button className='w-full rounded-full' onClick={onHandleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className='w-4 h-4 animate-spin' /> : null}
            {isPending ? 'Signing In...' : 'Sign In'}
          </Button>
          <p className='text-center text-sm text-charcoal'>Accounts are provisioned by an administrator.</p>
        </CardBox>
      </div>
    </div>
  )
}
