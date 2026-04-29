import BreadcrumbComp from '@/components/layout/BreadcrumbComp'
import CardBox from '@/components/shared/CardBox'
import SchemaFieldList from '@/components/forms/schema/fields/SchemaFieldList'
import type { Metadata } from 'next'
import { capitalizeFirstLetter } from '@/utils/format'

export const metadata: Metadata = { title: 'Loom Switch - Schema' }

const breadcrumbItems = [{ to: '/', title: 'Home' }, { to: '/schemas', title: 'Schemas' }]

type Props = { params: Promise<{ schemaName: string }> }

export default async function SchemaDetailPage({ params }: Props) {
  const { schemaName } = await params
  return (
    <>
      <BreadcrumbComp title={capitalizeFirstLetter(schemaName)} items={breadcrumbItems} />
      <CardBox className='bg-background'>
        <SchemaFieldList schemaName={schemaName} />
      </CardBox>
    </>
  )
}
