'use client'

import { useCallback, useState, useTransition } from 'react'
import useSWR from 'swr'
import { GetFieldWithGridItem, GridContainer } from '@/components/compounds/Grid'
import EnhancedTable from '@/components/compounds/Table'
import { JsonEditorDialog } from '@/components/shared/JsonEditorDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { API_ROUTES } from '@/constants/routes'
import { type Field, FieldName, FieldValidationType } from '@/types/field'
import { ButtonType } from '@/types/button'
import { type CellValue, ColumnNames, type ITableHeader, type RowState, TableType } from '@/types/table'
import { validateAndUpdateFields, ValidateFields } from '@/utils/fields'
import { constructPayloadFromFields } from '@/utils/payload'
import { parseFormValueToJson } from '@/utils/json'
import { errorToast, successToast } from '@/utils/toast'
import { fetcher } from '@/utils/fetcher'
import { Loader2 } from 'lucide-react'
import { type CreateFieldPayload, FIELD_CREATION_MAPPING, fieldCreationFields } from './fields'

type SchemaFieldRow = {
  id: string
  name: string
  valueType: string
  defaultValue: CellValue
  createdAt: string
}

type SchemaDetailResponse = {
  schema: {
    id: string
    name: string
    featureId: string
    fields: SchemaFieldRow[]
  }
}

type EditorState = { open: boolean; value: CellValue; id: string; name: string }
const EDITOR_CLOSED: EditorState = { open: false, value: null, id: '', name: '' }

const headers: ITableHeader[] = [
  { name: ColumnNames.No, key: 'no', label: 'S.No.', align: 'left', className: 'px-0 whitespace-normal', maxWidth: 50 },
  { name: ColumnNames.Name, key: 'name', label: 'Key name', align: 'left', className: 'px-0 whitespace-normal', maxWidth: 150 },
  { name: ColumnNames.ValueType, key: 'valueType', label: 'Key type', align: 'left', className: 'px-0' },
  { name: ColumnNames.DefaultValue, key: 'defaultValue', label: 'Default Value', align: 'left', className: 'px-0' },
  { name: ColumnNames.Delete, key: 'action', label: 'Action', align: 'left' },
]


type Props = { schemaName: string }

export default function SchemaFieldList({ schemaName }: Props) {
  const { data, mutate } = useSWR<SchemaDetailResponse>(
    API_ROUTES.SCHEMA(schemaName),
    fetcher,
    { revalidateOnFocus: false },
  )

  const [modalState, setModalState] = useState({ open: false, fields: structuredClone(fieldCreationFields) })
  const [isPending, startTransition] = useTransition()
  const [rowState, setRowState] = useState<RowState[]>([])
  const [editorState, setEditorState] = useState<EditorState>(EDITOR_CLOSED)

  const resetModalState = useCallback(() => {
    setModalState({ open: false, fields: structuredClone(fieldCreationFields) })
  }, [])

  const openDialog = () => {
    setModalState({ open: true, fields: structuredClone(fieldCreationFields) })
  }

  const onFieldChange = (_name: FieldName, value: string, field: Field) => {
    const { updatedFields } = validateAndUpdateFields(modalState.fields, FieldValidationType.FieldCreation, field, value)
    setModalState((prev) => ({ ...prev, fields: updatedFields }))
  }

  const onSubmitField = () => {
    const { hasError, updatedFields } = ValidateFields(modalState.fields, FieldValidationType.FieldCreation)
    if (hasError) {
      setModalState((prev) => ({ ...prev, fields: updatedFields }))
      return
    }

    const payload = constructPayloadFromFields<CreateFieldPayload>(updatedFields, FIELD_CREATION_MAPPING)
    const result = parseFormValueToJson(payload.valueType ?? '', payload.defaultValue ?? '')

    if (!result.ok) {
      errorToast(result.error)
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch(API_ROUTES.SCHEMA_FIELDS(schemaName), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: payload.name, valueType: payload.valueType, defaultValue: result.value }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as Record<string, unknown>
          errorToast((body.error as string) ?? 'Failed to add field')
          return
        }

        successToast('Field added successfully')
        resetModalState()
        await mutate()
      } catch {
        errorToast('Failed to add field')
      }
    })
  }

  const onDelete = (id: string) => {
    setRowState((prev) => [...prev, { id, loading: true }])
    startTransition(async () => {
      try {
        const res = await fetch(API_ROUTES.SCHEMA_FIELD(schemaName, id), { method: 'DELETE' })
        setRowState((prev) => prev.filter((r) => r.id !== id))
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as Record<string, unknown>
          errorToast((body.error as string) ?? 'Failed to delete field')
          return
        }
        successToast('Field deleted successfully')
        await mutate()
      } catch {
        setRowState((prev) => prev.filter((r) => r.id !== id))
        errorToast('Failed to delete field')
      }
    })
  }

  const onEditorSave = (buttonType: ButtonType, value: unknown) => {
    if (buttonType === ButtonType.Button) {
      setEditorState(EDITOR_CLOSED)
      return
    }

    const fieldId = editorState.id
    if (!fieldId) return

    startTransition(async () => {
      try {
        const res = await fetch(API_ROUTES.FEATURE_FIELD_VALUE(schemaName, fieldId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as Record<string, unknown>
          errorToast((body.error as string) ?? 'Failed to save value')
          return
        }
        successToast('Value updated successfully')
        setEditorState(EDITOR_CLOSED)
        await mutate()
      } catch {
        errorToast('Failed to save value')
      }
    })
  }

  const onTableClick = (
    name: ColumnNames,
    _value: CellValue,
    _additionalData?: Record<string, unknown>,
    row?: Record<string, CellValue>,
  ) => {
    if (name === ColumnNames.Delete && row?.id) {
      onDelete(String(row.id))
    }
    if (name === ColumnNames.DefaultValue && row?.id) {
      const field = (data?.schema?.fields ?? []).find((f) => f.id === row.id)
      setEditorState({
        open: true,
        value: row.defaultValue ?? null,
        id: String(row.id),
        name: field?.name ?? '',
      })
    }
  }

  return (
    <div className='my-6'>
      <div className='flex justify-between items-center mb-4'>
        <Button onClick={openDialog} className='rounded-full whitespace-nowrap'>
          Add Field
        </Button>
      </div>

      <EnhancedTable
        headers={headers}
        data={data?.schema?.fields ?? []}
        onClick={onTableClick}
        tableType={TableType.Schema}
        rowState={rowState}
      />

      <Dialog open={modalState.open} onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}>
        <DialogContent className='sm:max-w-[620px]'>
          <DialogHeader>
            <DialogTitle>Add New Field</DialogTitle>
          </DialogHeader>

          <div className='py-4'>
            <GridContainer spacing={4}>
              {modalState.fields.map((field) => (
                <GetFieldWithGridItem key={field.name} field={field} onUpdate={onFieldChange} />
              ))}
            </GridContainer>
          </div>

          <div className='flex justify-end gap-3'>
            <Button className='rounded-full text-white'  onClick={onSubmitField} disabled={isPending}>
              {isPending ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : null}
              Save
            </Button>
            <Button variant={'destructive'} className='rounded-full text-white' onClick={resetModalState} disabled={isPending} >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <JsonEditorDialog
        state={editorState}
        onOpenChange={(open) => { if (!open) setEditorState(EDITOR_CLOSED) }}
        renderFooter={({ draft, setDraft, isValueChanged }) => (
          <div className='flex justify-between pt-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={isPending}
              onClick={() => {
                try {
                  setDraft(JSON.stringify(JSON.parse(draft), null, 2))
                } catch {
                  errorToast('Invalid JSON — cannot format')
                }
              }}
            >
              Format JSON
            </Button>
            <div className='flex gap-3'>
              <Button variant='destructive' className='rounded-full text-white' onClick={() => setEditorState(EDITOR_CLOSED)} disabled={isPending}>
                Close
              </Button>
              <Button
                disabled={isPending || !isValueChanged}
                onClick={() => {
                  let parsed: unknown
                  try {
                    parsed = JSON.parse(draft)
                  } catch {
                    errorToast('Invalid JSON — please fix before saving')
                    return
                  }
                  onEditorSave(ButtonType.Submit, parsed)
                }}
              >
                {isPending ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : null}
                Done
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  )
}
