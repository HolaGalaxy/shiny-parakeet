import UserList from '@/components/forms/users/UserList'
import BreadcrumbComp from '@/components/layout/BreadcrumbComp'
import CardBox from '@/components/shared/CardBox'
import { getUsersAction } from '@/server/actions/user'

const breadcrumbItems = [{ to: '/', title: 'Home' }]

export default async function UsersPage() {
  const result = await getUsersAction()

  const data = result.success
    ? result.data.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: u.createdAt,
    }))
    : []

  return <>
    <BreadcrumbComp title='Users' items={breadcrumbItems} />
    <CardBox className='bg-background'>
      <UserList data={data} />
    </CardBox>
  </>
}
