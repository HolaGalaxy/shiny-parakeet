'use client'

import useSWR from 'swr'
import type { SessionUser } from '@/types/auth'
import { API_ROUTES } from '@/constants/routes'

const fetcher = async (url: string): Promise<SessionUser> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Session expired')
  const data: { user: SessionUser } = await res.json()
  return data.user
}

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<SessionUser>(
    API_ROUTES.AUTH_ME,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  )

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data && !error,
    error,
    mutate,
  }
}
