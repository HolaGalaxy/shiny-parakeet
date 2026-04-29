import BreadcrumbComp from '@/components/layout/BreadcrumbComp'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Loom Switch - Dashboard' }

const breadcrumbItems = [{ to: '/', title: 'Home' }]

export default function DashboardPage() {
  return (
    <>
      <BreadcrumbComp title='Dashboard' items={breadcrumbItems} />
      <div className='grid grid-cols-12 gap-6'>
        <div className='col-span-12'>
          <div className='rounded-lg border border-border/40 bg-card p-8 text-center'>
            <h2 className='text-2xl font-semibold text-dark dark:text-white mb-2'>
              Welcome to Loom Switch
            </h2>
            <p className='text-muted-foreground'>
              Manage your feature flags, schemas, and configurations from the sidebar.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
