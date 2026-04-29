import BreadcrumbComp from '@/components/layout/BreadcrumbComp'
import CreateSchemaForm from '@/components/forms/schema/create/CreateSchemaForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Loom Switch - Create Schema' }

const breadcrumbItems = [{ to: '/', title: 'Home' }, { title: 'Schemas' }]

export default function CreateSchemaPage() {
  return (
    <>
      <BreadcrumbComp title='Create Schema' items={breadcrumbItems} />
      <CreateSchemaForm />
    </>
  )
}
