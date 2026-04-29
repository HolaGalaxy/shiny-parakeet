'use client'

import FullLogo from '@/components/layout/FullLogo'
import CardBox from '@/components/shared/CardBox'
import { GetFieldWithGridItem, GridContainer } from '@/components/compounds/Grid'
import { Button } from '@/components/ui/button'
import { type Field, FieldName, FieldType, FieldValidationType, FieldVariant } from '@/types/field'
import { extractFieldValue } from '@/utils/type-guards'
import { errorToast, successToast } from '@/utils/toast'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { verifyInviteTokenAction, activateAccountAction } from '@/server/actions/user'
import { ROUTES } from '@/constants/routes'
import { validateAndUpdateFields, ValidateFields } from '@/utils/fields'

const passwordFields: Field[] = [
  {
    index: 0, xs: 12, label: 'New Password', name: FieldName.Password, type: FieldType.Password,
    placeholder: 'Enter your password', required: true, error: false, value: '',
    errors: ['Password is required.', 'Password must be between 6 and 256 characters.'],
    variant: FieldVariant.Default, minLength: 6, maxLength: 256,
  },
  {
    index: 1, xs: 12, label: 'Confirm Password', name: FieldName.ConfirmPassword, type: FieldType.Password,
    placeholder: 'Confirm your password', required: true, error: false, value: '',
    errors: ['Confirm password is required.', 'Passwords do not match.'],
    variant: FieldVariant.Default,
  },
]

type Props = { token: string }

export default function VerifyForm({ token }: Props) {
  const router = useRouter()
  const [fields, setFields] = useState<Field[]>(structuredClone(passwordFields))
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'loading' | 'valid' | 'error' | 'success'>('loading')
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    verifyInviteTokenAction(token).then((res) => {
      if (res.success) {
        setStatus('valid')
        setEmail(res.data.email)
      } else {
        setStatus('error')
        setErrorMessage(res.error)
      }
    })
  }, [token])

  const onHandleInputChange = (name: FieldName, value: string, field: Field) => {
    const { updatedFields } = validateAndUpdateFields(fields, FieldValidationType.PasswordSetup, field, value)
    setFields(updatedFields)
  }

  const onHandleSubmit = () => {
    const { hasError, updatedFields } = ValidateFields(fields, FieldValidationType.PasswordSetup)
    if (hasError) {
      setFields(updatedFields)
      return
    }

    const passwordField = updatedFields[0]
    const password = passwordField ? extractFieldValue(passwordField.value) : ''

    startTransition(async () => {
      const result = await activateAccountAction({ token, password })
      if (!result.success) {
        errorToast(result.error)
        return
      }
      setStatus('success')
      successToast('Account activated! Redirecting to login...')
      setTimeout(() => router.push(ROUTES.LOGIN), 3000)
    })
  }

  if (status === 'loading') {
    return (
      <div className='h-screen w-full flex justify-center items-center bg-lightprimary'>
        <div className='animate-pulse text-muted-foreground'>Verifying invite link...</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className='h-screen w-full flex justify-center items-center bg-lightprimary'>
        <div className='md:min-w-[450px] min-w-max'>
          <CardBox>
            <div className='flex justify-center mb-4'><FullLogo /></div>
            <div className='text-center'>
              <p className='text-error font-medium mb-2'>Verification Failed</p>
              <p className='text-sm text-muted-foreground'>{errorMessage}</p>
            </div>
          </CardBox>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className='h-screen w-full flex justify-center items-center bg-lightprimary'>
        <div className='md:min-w-[450px] min-w-max'>
          <CardBox>
            <div className='flex justify-center mb-4'><FullLogo /></div>
            <div className='text-center'>
              <p className='text-success font-medium mb-2'>Account Activated!</p>
              <p className='text-sm text-muted-foreground'>Redirecting to login...</p>
            </div>
          </CardBox>
        </div>
      </div>
    )
  }

  return (
    <div className='h-screen w-full flex justify-center items-center bg-lightprimary'>
      <div className='md:min-w-[450px] min-w-max'>
        <CardBox>
          <div className='flex justify-center mb-4'><FullLogo /></div>
          <div className='text-center mb-4'>
            <h2 className='text-lg font-semibold'>Set Your Password</h2>
            <p className='text-sm text-muted-foreground'>{email}</p>
          </div>
          <GridContainer spacing={6}>
            {fields.map((field) => (
              <GetFieldWithGridItem key={field.name} field={field} onUpdate={onHandleInputChange} />
            ))}
          </GridContainer>
          <Button className='w-full rounded-full' onClick={onHandleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className='w-4 h-4 animate-spin' /> : null}
            {isPending ? 'Activating...' : 'Activate Account'}
          </Button>
        </CardBox>
      </div>
    </div>
  )
}
