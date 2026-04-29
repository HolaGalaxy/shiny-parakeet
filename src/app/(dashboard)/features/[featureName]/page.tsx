import FeatureDetails from '@/components/forms/feature/FeatureDetails'
import BreadcrumbComp from '@/components/layout/BreadcrumbComp'
import { capitalizeFirstLetter } from '@/utils/format'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Loom Switch - Feature' }

const breadcrumbItems = [{ to: '/', title: 'Home' }, { to: '/features', title: 'Features' }]

type Props = { params: Promise<{ featureName: string }> }

export default async function FeatureDetailPage({ params }: Props) {
  const { featureName } = await params
  return (
    <>
      <BreadcrumbComp title={capitalizeFirstLetter(featureName)} items={breadcrumbItems} />
      <FeatureDetails featureName={featureName} />
    </>
  )
}
