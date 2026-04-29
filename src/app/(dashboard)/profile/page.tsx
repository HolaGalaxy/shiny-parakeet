import { getProfileAction } from '@/server/actions/profile'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/forms/profile/ProfileForm'
import { ROUTES } from '@/constants/routes'

export default async function ProfilePage() {
  const result = await getProfileAction()

  if (!result.success) {
    redirect(ROUTES.LOGIN)
  }

  return <ProfileForm profile={result.data} />
}
