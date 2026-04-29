import useSWR from 'swr'
import { API_ROUTES } from '@/constants/routes'
import { fetcher } from '@/utils/fetcher'
import type { ResolvedFeaturesResponse } from './reference-types'

export function useResolvedFeatures() {
    return useSWR<ResolvedFeaturesResponse>(
        API_ROUTES.FEATURES,
        fetcher,
        { revalidateOnFocus: false },
    )
}