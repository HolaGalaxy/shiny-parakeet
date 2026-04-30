'use client'

import EnhancedTable from '@/components/compounds/Table'
import { ColumnNames, type ITableHeader, TableType } from '@/types/table'
import { ROUTES } from '@/constants/routes'
import type { SchemaRow } from '@/types/schema'
import { useRouter } from 'next/navigation'

const headers: ITableHeader[] = [
    { name: ColumnNames.No, key: 'no', label: 'S.No.', align: 'left', className: 'px-0 whitespace-normal', maxWidth: 50 },
    { name: ColumnNames.Name, key: 'name', label: 'Name', align: 'left', className: 'px-0 whitespace-normal', maxWidth: 100 },
    { name: ColumnNames.Description, key: 'description', label: 'Description', align: 'left', className: 'px-0 whitespace-normal' },
    { name: ColumnNames.CreatedAt, key: 'createdAt', label: 'Created At', align: 'left', className: 'px-0' },
    { name: ColumnNames.View, key: 'view', label: 'View', align: 'left', className: 'px-0' },
]

type Props = { data: SchemaRow[] }

export default function FeatureList({ data }: Props) {
    const router = useRouter()

    const onClick = (name: ColumnNames, _value: unknown, _ad?: Record<string, unknown>, row?: SchemaRow) => {
        if (name === ColumnNames.View && row?.name) {
            router.push(ROUTES.FEATURE_DETAIL(row.name))
        }
    }

    return (
        <div className='my-6'>
            <EnhancedTable headers={headers} data={data} onClick={onClick} tableType={TableType.SchemaList} />
        </div>
    )
}
