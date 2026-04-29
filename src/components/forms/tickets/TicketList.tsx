'use client'

import EnhancedTable from '@/components/compounds/Table'
import { ColumnNames, type ITableHeader, TableType } from '@/types/table'
import { ROUTES } from '@/constants/routes'
import type { TicketListItem } from '@/types/ticket'
import { useRouter } from 'next/navigation'

const headers: ITableHeader[] = [
  { name: ColumnNames.No, key: 'no', label: 'S.No.', align: 'left', className: 'px-0 whitespace-normal', maxWidth: 50 },
  { name: ColumnNames.Schema, key: 'schemaName', label: 'Schema', align: 'left', className: 'px-0 whitespace-normal', maxWidth: 120 },
  { name: ColumnNames.Type, key: 'type', label: 'Type', align: 'left', className: 'px-0' },
  { name: ColumnNames.CreatedBy, key: 'createdByEmail', label: 'Created By', align: 'left', className: 'px-0 whitespace-normal' },
  { name: ColumnNames.CreatedAt, key: 'createdAt', label: 'Created At', align: 'left', className: 'px-0' },
  { name: ColumnNames.Status, key: 'status', label: 'Status', align: 'left', className: 'px-0' },
  { name: ColumnNames.Detail, key: 'detail', label: 'Details', align: 'left', className: 'px-0' },
]

type Props = { data: TicketListItem[] }

export default function TicketList({ data }: Props) {
  const router = useRouter()

  const onClick = (name: ColumnNames, _value: unknown, _ad?: Record<string, unknown>, row?: TicketListItem) => {
    if (name === ColumnNames.Detail && row?.id) {
      router.push(ROUTES.TICKET_DETAIL(row.id))
    }
  }

  return (
    <div className='my-6'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-lg font-semibold'>Global Tickets</h2>
      </div>
      <EnhancedTable headers={headers} data={data} onClick={onClick} tableType={TableType.TicketList} />
    </div>
  )
}
