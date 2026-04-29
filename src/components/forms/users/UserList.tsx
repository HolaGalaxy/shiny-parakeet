'use client'

import EnhancedTable from '@/components/compounds/Table'
import { ColumnNames, type ITableHeader, TableType } from '@/types/table'
import { Button } from '@/components/ui/button'
import { deleteUserAction } from '@/server/actions/user'
import { successToast, errorToast } from '@/utils/toast'
import { ROUTES } from '@/constants/routes'
import type { UserRow } from '@/types/user'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

const headers: ITableHeader[] = [
  { name: ColumnNames.No, key: 'no', label: 'S.No.', align: 'left', className: 'px-0 whitespace-normal', maxWidth: 50 },
  { name: ColumnNames.Name, key: 'name', label: 'Name', align: 'left', className: 'px-0 whitespace-normal', maxWidth: 150 },
  { name: ColumnNames.Email, key: 'email', label: 'Email', align: 'left', className: 'px-0 whitespace-normal' },
  { name: ColumnNames.Role, key: 'role', label: 'Role', align: 'left', className: 'px-0' },
  { name: ColumnNames.Status, key: 'status', label: 'Status', align: 'left', className: 'px-0' },
  { name: ColumnNames.CreatedAt, key: 'createdAt', label: 'Created', align: 'left', className: 'px-0' },
  { name: ColumnNames.Delete, key: 'action', label: 'Action', align: 'left' },
]

type Props = { data: UserRow[] }

export default function UserList({ data }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [rowState, setRowState] = useState<{ id: string | number; loading: boolean }[]>([])

  const onDelete = (id: string) => {
    setRowState((prev) => [...prev, { id, loading: true }])
    startTransition(async () => {
      const result = await deleteUserAction(id)
      setRowState((prev) => prev.filter((r) => r.id !== id))
      if (!result.success) {
        errorToast(result.error)
        return
      }
      successToast('User deleted')
      router.refresh()
    })
  }

  const onClick = (name: ColumnNames, _value: unknown, _ad?: Record<string, unknown>, row?: UserRow) => {
    if (name === ColumnNames.Delete && row?.id) onDelete(row.id)
  }

  return (
    <div className='my-6'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-lg font-semibold'>Users</h2>
        <Button onClick={() => router.push(ROUTES.USER_CREATE)} className='rounded-full whitespace-nowrap'>Add User</Button>
      </div>
      <EnhancedTable headers={headers} data={data} onClick={onClick} tableType={TableType.UserList} rowState={rowState} />
    </div>
  )
}
