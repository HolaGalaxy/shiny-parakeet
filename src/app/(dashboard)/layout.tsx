'use client'

import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { useSession } from '@/lib/auth/use-session'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ROUTES } from '@/constants/routes'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user, isLoading, isAuthenticated } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTES.LOGIN)
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className='flex w-full min-h-screen items-center justify-center bg-lightgray dark:bg-background'>
        <div className='animate-pulse text-muted-foreground'>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className='flex w-full min-h-screen bg-lightgray dark:bg-dark'>
      <div className='page-wrapper flex w-full'>
        <div className='xl:block hidden'>
          <Sidebar userRole={user?.role} />
        </div>
        <div className='body-wrapper w-full'>
          <Header />
          <div className='container mx-auto px-6 py-30'>{children}</div>
        </div>
      </div>
    </div>
  )
}