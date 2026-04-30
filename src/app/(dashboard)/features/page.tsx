import FeatureList from '@/components/forms/feature/FeatureList'
import BreadcrumbComp from '@/components/layout/BreadcrumbComp'
import CardBox from '@/components/shared/CardBox'
import { getSchemasAction } from '@/server/actions/schema'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Loom Switch - Features' }

const breadcrumbItems = [{ to: '/', title: 'Home' }]

export default async function FeaturesPage() {
  const response = await getSchemasAction()
  // featuresData is same as schemasData
  const featuresData = response.success && response.code === 200 ? response.data : []

  return (
    <>
      <BreadcrumbComp title='Features' items={breadcrumbItems} />
      <CardBox className='bg-background'>
        <FeatureList data={featuresData} />
      </CardBox>
    </>
  )
}
