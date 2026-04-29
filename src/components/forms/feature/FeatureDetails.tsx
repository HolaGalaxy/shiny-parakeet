'use client'

import useSWR from 'swr'
import CardBox from '@/components/shared/CardBox'
import { API_ROUTES } from '@/constants/routes'
import type { FeatureFieldsResponse } from '@/types/feature'
import ReferenceKeysCard from './ReferenceKeysCard'
import FeatureKeysCard from './FeatureKeysCard'
import { fetcher } from '@/utils/fetcher'

type Props = { featureName: string }

export default function FeatureDetails({ featureName }: Props) {
    const { data, isLoading, mutate } = useSWR<FeatureFieldsResponse>(
        API_ROUTES.FEATURE_FIELDS(featureName),
        fetcher,
        { revalidateOnFocus: false },
    )

    if (isLoading) {
        return (
            <div className='col-span-12 flex items-center justify-center py-20 text-muted-foreground'>
                Loading feature data...
            </div>
        )
    }

    return (
        <div className="grid grid-cols-12 gap-30">
            <div className="col-span-12">
                <CardBox className="bg-background">
                    <ReferenceKeysCard
                        featureName={featureName}
                        data={data}
                        mutate={mutate}
                    />
                </CardBox>
            </div>

            <div className="col-span-12">
                <CardBox className="bg-background">
                    <FeatureKeysCard
                        featureName={featureName}
                        data={data}
                        mutate={mutate}
                    />
                </CardBox>
            </div>
        </div>
    )
}