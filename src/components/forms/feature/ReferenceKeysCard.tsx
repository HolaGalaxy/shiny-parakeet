'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/constants/routes'
import type { FeatureFieldRow, FeatureFieldsResponse } from '@/types/feature'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useState } from 'react'
import type { KeyedMutator } from 'swr'
import ReferenceEditDialog from './MappedFeature/ReferenceEditDialog'

export type ReferenceKeysCardProps = {
  featureName: string
  data: FeatureFieldsResponse | undefined
  mutate: KeyedMutator<FeatureFieldsResponse>
}

export default function ReferenceKeysCard(props: ReferenceKeysCardProps) {
  const { data } = props
  const [dialogOpen, setDialogOpen] = useState(false)
  const fields = (data?.fields ?? []) as FeatureFieldRow[]
  const references = fields.filter((f) => f.reference !== null) as FeatureFieldRow[]

  return (
    <div className='p-5'>
      <div className='flex items-center justify-between mb-1'>
        <h3 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
          Reference Keys
        </h3>
        <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => setDialogOpen(true)}>
          <Icon icon='solar:pen-bold-duotone' width={16} height={16} />
        </Button>
      </div>
      <Separator className='mb-4' />

      {references.length === 0 ? (
        <p className='text-sm text-muted-foreground italic py-4'>
          No reference keys mapped yet. Click the edit icon to add mappings.
        </p>
      ) : (
        <div className='flex flex-col gap-2.5'>
          {references.map((field) => {
            const ref = field.reference!
            return (
              <div key={field.schemaFieldId} className='flex items-center gap-2 text-[15px]'>
                <div className='flex items-center shrink-0'>
                  <p className='font-semibold text-foreground'>{field.name}</p>
                  <span className='ml-1 text-foreground'>:</span>
                </div>
                <Link
                  href={ROUTES.FEATURE_DETAIL(ref.targetSchemaName)}
                  className='text-primary font-medium hover:underline cursor-pointer'
                >
                  {ref.targetSchemaName}
                </Link>
                <span className='text-muted-foreground'>&rarr;</span>
                <span className='text-foreground'>{ref.targetFieldName}</span>
              </div>
            )
          })}
        </div>
      )}

      {dialogOpen ? <ReferenceEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        {...props}
      /> : null}
    </div>
  )
}
