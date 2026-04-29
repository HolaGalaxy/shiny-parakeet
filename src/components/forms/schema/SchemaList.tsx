'use client'

import EnhancedTable from '@/components/compounds/Table'
import { ColumnNames, type ITableHeader, TableType } from '@/types/table'
import { Button } from '@/components/ui/button'
import { deleteSchemaAction } from '@/server/actions/schema'
import { successToast, errorToast } from '@/utils/toast'
import { ROUTES } from '@/constants/routes'
import type { SchemaRow } from '@/types/schema'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

const headers: ITableHeader[] = [
  { name: ColumnNames.No, key: 'no', label: 'S.No.', align: 'left', className: 'px-0 whitespace-normal', maxWidth: 50 },
  { name: ColumnNames.Name, key: 'name', label: 'Name', align: 'left', className: 'px-0 whitespace-normal', maxWidth: 100 },
  { name: ColumnNames.Description, key: 'description', label: 'Description', align: 'left', className: 'px-0 whitespace-normal' },
  { name: ColumnNames.CreatedAt, key: 'createdAt', label: 'Created At', align: 'left', className: 'px-0' },
  { name: ColumnNames.View, key: 'view', label: 'View', align: 'left', className: 'px-0' },
  { name: ColumnNames.Delete, key: 'action', label: 'Action', align: 'left' },
]

type Props = { data: SchemaRow[] }

export default function SchemaList({ data }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [rowState, setRowState] = useState<{ id: string | number; loading: boolean }[]>([])

  const onDelete = (id: string) => {
    setRowState((prev) => [...prev, { id, loading: true }])
    startTransition(async () => {
      const result = await deleteSchemaAction(id)
      setRowState((prev) => prev.filter((r) => r.id !== id))
      if (!result.success) {
        errorToast(result.error)
        return
      }
      successToast('Schema deleted')
      router.refresh()
    })
  }

  const onClick = (name: ColumnNames, _value: unknown, _ad?: Record<string, unknown>, row?: SchemaRow) => {
    if (name === ColumnNames.Delete && row?.id) {
      onDelete(row.id)
    } else if (name === ColumnNames.View && row?.name) {
      router.push(ROUTES.SCHEMA_DETAIL(row.name))
    }
  }

  return (
    <div className='my-6'>
      <div className='flex justify-between items-center mb-4'>
        <Button onClick={() => router.push(ROUTES.SCHEMA_CREATE)} className='rounded-full whitespace-nowrap'>
          Create Schema
        </Button>
      </div>
      <EnhancedTable headers={headers} data={data} onClick={onClick} tableType={TableType.SchemaList} rowState={rowState} />
    </div>
  )
}
