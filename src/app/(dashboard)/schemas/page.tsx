import BreadcrumbComp from '@/components/layout/BreadcrumbComp'
import CardBox from '@/components/shared/CardBox'
import SchemaList from '@/components/forms/schema/SchemaList'
import { getSchemasAction } from '@/server/actions/schema'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Loom Switch - Schemas' }

const breadcrumbItems = [{ to: '/', title: 'Home' }]

export default async function SchemasPage() {
  const response = await getSchemasAction()
  const schemasData = response.success && response.code === 200 ? response.data : []

  return (
    <>
      <BreadcrumbComp title='Schemas' items={breadcrumbItems} />
      <CardBox className='bg-background'>
        <SchemaList data={schemasData} />
      </CardBox>
    </>
  )
}
