import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Image from 'next/image'
import noDataImage from '../../../public/images/svgs/no-data.svg'
import { Icon } from '@iconify/react'
import { Loader2 } from 'lucide-react'
import { formatDate } from '@/utils/format'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Button } from '../ui/button'
import { ColumnNames, TableType, type ITableHeader, type IEnhancedTableProps, type RowState } from '@/types/table'
import { Badge, BadgeProps } from '../ui/badge'

type CellValue = string | number | boolean | object | null

function displayCellValue(value: CellValue): string {
  if (value == null) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function TableCellRenderer<T extends Record<string, CellValue>>({
  row,
  header,
  onClick,
  additionalData,
  index,
  rowState,
}: {
  row: T
  header: ITableHeader
  onClick?: IEnhancedTableProps<T>['onClick']
  additionalData?: Record<string, unknown>
  tableType: TableType
  index: number
  rowState?: RowState[]
}) {
  const cellValue = row[header.name] as CellValue

  switch (header.name) {
    case ColumnNames.Name:
      return (
        <TableCell key={header.key} className={header.className} style={{ maxWidth: header.maxWidth }} align={header.align} onClick={() => onClick?.(header.name, cellValue ?? '', additionalData)}>
          <h6 className="text-base truncate">{displayCellValue(cellValue)}</h6>
        </TableCell>
      )

    case ColumnNames.No:
      return (
        <TableCell key={header.key} className={header.className} style={{ maxWidth: header.maxWidth }} align={header.align}>
          {index + 1}
        </TableCell>
      )

    case ColumnNames.Delete: {
      const rowId = (row as Record<string, string | number | null>).id
      const isDeleting = rowState?.some((_r) => _r.id === rowId && _r.loading)

      return (
        <TableCell key={header.key} className={header.className} style={{ maxWidth: header.maxWidth }} align={header.align}>
          <div className='min-h-[24px]'>
            {isDeleting ? (
              <Loader2 className='w-5 h-5 animate-spin text-muted-foreground' />
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant='ghost' size='icon' className='hover:text-red-600' onClick={() => onClick?.(header.name, (row[header.key as keyof T] as string | number) ?? '', additionalData, row)}>
                      <Icon icon='tabler:trash' className='!w-5 !h-5' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Delete</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </TableCell>
      )
    }

    case ColumnNames.CreatedAt:
      return (
        <TableCell key={header.key} className={header.className} style={{ maxWidth: header.maxWidth }} align={header.align}>
          {formatDate(cellValue as string, "E, MMM d")}
        </TableCell>
      )

    case ColumnNames.View:
      return (
        <TableCell key={header.key} className={header.className} style={{ maxWidth: header.maxWidth }} align={header.align}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='hover:text-blue-600' onClick={() => onClick?.(header.name, (row[header.key as keyof T] as string | number) ?? '', additionalData, row)}>
                  <Icon icon='solar:eye-outline' className='!w-5 !h-5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>View</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )

    case ColumnNames.Detail:
      return (
        <TableCell key={header.key} className={header.className} style={{ maxWidth: header.maxWidth }} align={header.align}>
          <Button variant='default' size='sm' className='rounded-full text-xs' onClick={() => onClick?.(header.name, (row[header.key as keyof T] as string | number) ?? '', additionalData, row)}>
            Detail
          </Button>
        </TableCell>
      )

    case ColumnNames.Status: {
      const statusValue = cellValue as string
      const statusColorMap: Record<string, string> = {
        PENDING: 'text-warning',
        APPROVED: 'text-success',
        REJECTED: 'text-error',
        ACTIVE: 'text-success',
        INACTIVE: 'text-muted-foreground',
      }
      return (
        <TableCell key={header.key} className={header.className} style={{ maxWidth: header.maxWidth }} align={header.align}>
          <span className={`font-medium ${statusColorMap[statusValue] ?? 'text-ld'}`}>{statusValue}</span>
        </TableCell>
      )
    }

    case ColumnNames.Role:
      return (
        <TableCell key={header.key} className={header.className} style={{ maxWidth: header.maxWidth }} align={header.align}>
          <span className='inline-flex items-center rounded-full bg-lightprimary px-2 py-0.5 text-xs font-medium text-primary'>
            {(cellValue as string)?.replace('_', ' ')}
          </span>
        </TableCell>
      )

    case ColumnNames.ValueType: {
      const typeValue = (cellValue as string) ?? ''
      const chipStyles: Record<string, BadgeProps['variant']> = {
        STRING: 'lightSuccess',
        NUMBER: 'lightWarning',
        BOOLEAN: 'lightError',
        ARRAY: 'lightPrimary',
        OBJECT: 'lightInfo',
      }
      return (
        <TableCell key={header.key} className={header.className} style={{ maxWidth: header.maxWidth }} align={header.align}>
          <Badge variant={chipStyles[typeValue]} className={` rounded-md`}>
            {typeValue}
          </Badge>
        </TableCell>
      )
    }

    case ColumnNames.DefaultValue: {
      const isEmpty = cellValue === null || cellValue === undefined
      const display = isEmpty ? '—' : JSON.stringify(cellValue)
      return (
        <TableCell key={header.key} className={header.className} style={{ maxWidth: header.maxWidth ?? 200 }} align={header.align}>
          <div className='flex items-center gap-2'>
            <p
              className={`max-w-md truncate ${isEmpty ? 'text-muted-foreground' : 'cursor-pointer hover:text-primary underline decoration-dashed underline-offset-2'}`}
              title={isEmpty ? undefined : display}
              onClick={isEmpty ? undefined : () => onClick?.(header.name, cellValue ?? '', additionalData, row)}
            >
              {display}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Icon icon='solar:info-circle-linear' className='w-4 h-4' />
                </TooltipTrigger>
                <TooltipContent><p>Click the text to view/edit as JSON</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      )
    }

    default:
      return (
        <TableCell key={header.key} className={header.className} style={{ maxWidth: header.maxWidth }} align={header.align}>
          {displayCellValue(cellValue)}
        </TableCell>
      )
  }
}

export default function EnhancedTable<T extends { id: string | number } & Record<string, CellValue>>({
  headers,
  data,
  onClick,
  tableType,
  additionalData,
  className,
  rowState,
}: IEnhancedTableProps<T>) {
  return (
    <div className='overflow-x-auto'>
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header.key} className={header.className} style={{ maxWidth: header.maxWidth }} align={header.align}>
                {header.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? (
            data.map((row, index) => (
              <TableRow key={row.id}>
                {headers.map((header) => (
                  <TableCellRenderer
                    key={header.key}
                    row={row}
                    index={index}
                    header={header}
                    onClick={onClick}
                    additionalData={additionalData}
                    tableType={tableType}
                    rowState={rowState}
                  />
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length} className='whitespace-normal'>
                <div className='flex items-center justify-center my-6'>
                  <div className='text-center'>
                    <Image src={noDataImage} alt='No data' className='mb-4 mx-auto' width={400} height={300} />
                    <h6 className='text-xl text-ld'>No data found</h6>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export { ColumnNames, TableType } from '@/types/table'
export type { ITableHeader, IEnhancedTableProps } from '@/types/table'
