import { redirect } from 'next/navigation'
import VerifyForm from '@/components/forms/verify/VerifyForm'
import { ROUTES } from '@/constants/routes'

type Props = {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    redirect(ROUTES.LOGIN)
  }

  return <VerifyForm token={token} />
}
