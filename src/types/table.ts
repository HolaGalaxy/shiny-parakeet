export enum ColumnNames {
  No = 'no',
  Name = 'name',
  Description = 'description',
  CreatedAt = 'createdAt',
  Delete = 'delete',
  View = 'view',
  Type = 'type',
  Value = 'value',
  Email = 'email',
  Role = 'role',
  Status = 'status',
  CreatedBy = 'createdBy',
  Schema = 'schema',
  Detail = 'detail',
  Action = 'action',
  ValueType = 'valueType',
  DefaultValue = 'defaultValue',
}

export enum TableType {
  SchemaList = 'schemaList',
  Schema = 'schema',
  UserList = 'userList',
  TicketList = 'ticketList',
}

export interface ITableHeader {
  name: ColumnNames
  key: string
  label: string
  maxWidth?: number
  align?: 'left' | 'center' | 'right'
  className?: string
}

export type RowState = { id: string | number; loading: boolean }

export type CellValue = string | number | boolean | object | null

export interface IEnhancedTableProps<T> {
  headers: ITableHeader[]
  data: T[]
  onClick?: (name: ColumnNames, value: CellValue, additionalData?: Record<string, unknown>, row?: T) => void
  tableType: TableType
  additionalData?: Record<string, unknown>
  className?: string
  rowState?: RowState[]
}
