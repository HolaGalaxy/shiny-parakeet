'use client'

import { GridContainer, GridItem } from '@/components/compounds/Grid'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { API_ROUTES } from '@/constants/routes'
import type { FeatureFieldsResponse } from '@/types/feature'
import { type Field, FieldName, FieldValidationType } from '@/types/field'
import { validateAndUpdateFields, ValidateFields } from '@/utils/fields'
import { errorToast, successToast } from '@/utils/toast'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import type { KeyedMutator } from 'swr'

import ReferenceMappingRow from './ReferenceMappingRow'
import {
    applyValidationToRows,
    buildEmptyMappingRow,
    buildExistingFieldRows,
    buildReferencePayload,
    findDuplicateKeys,
} from './reference-transforms'
import { useResolvedFeatures } from './useResolvedFeatures'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: FeatureFieldsResponse | undefined
    mutate: KeyedMutator<FeatureFieldsResponse>
}

export default function ReferenceEditDialog({ open, onOpenChange, mutate, data }: Props) {
    const [isPending, startTransition] = useTransition()
    const { data: featuresData } = useResolvedFeatures()

    const [existingRows, setExistingRows] = useState<Field[][]>([])
    const [newRows, setNewRows] = useState<Field[][]>([])

    const dataFieldsKey = useMemo(
        () => (data?.fields ?? []).map((f) => f.schemaFieldId).join(','),
        [data?.fields],
    )

    useEffect(() => {
        setExistingRows(buildExistingFieldRows(data, featuresData))
        setNewRows([buildEmptyMappingRow(0, data, featuresData)])
    }, [dataFieldsKey, featuresData])

    const handleClose = () => {
        if (!isPending) onOpenChange(false)
    }

    const updateRow = (
        setter: React.Dispatch<React.SetStateAction<Field[][]>>, row: number,
        field: Field, value: string,
    ) => {
        setter((prev) => {
            const rows = structuredClone(prev)
            let { updatedFields } = validateAndUpdateFields(rows[row] ?? [], FieldValidationType.FieldCreation, field, value)

            if (field.name === FieldName.Feature) {
                const feature = featuresData?.features.find((f) => f.featureId === value)
                updatedFields = updatedFields.map((fld) =>
                    fld.name === FieldName.FeatureKey
                        ? {...fld, value: '', disabled: false, options: feature?.fields.map((f) => ({ id: f.schemaFieldId, label: f.name, value: f.schemaFieldId})),}
                        : fld,
                )
            }

            rows[row] = updatedFields
            return rows
        })
    }

    const handleExistingUpdate = (_name: FieldName, value: string, field: Field, extra?: any) => {
        updateRow(setExistingRows, extra?.row ?? 0, field, value)
    }

    const handleNewUpdate = (_name: FieldName, value: string, field: Field, extra?: any) => {
        updateRow(setNewRows, extra?.row ?? 0, field, value)
    }

    const handleRemoveExisting = (row: number) => {
        setExistingRows((prev) => prev.filter((_, i) => i !== row))
    }

    const handleRemoveNew = (row: number) => {
        setNewRows((prev) => prev.filter((_, i) => i !== row))
    }

    const handleAddNew = () => {
        setNewRows((prev) => [...prev, buildEmptyMappingRow(prev.length, data, featuresData)])
    }

    const handleSave = () => {
        const allRows = [...existingRows, ...newRows]
        const { hasError, updatedFields } = ValidateFields(allRows.flat(), FieldValidationType.Submit)

        if (hasError) {
            const validated = applyValidationToRows(allRows, updatedFields)
            setExistingRows(validated.slice(0, existingRows.length))
            setNewRows(validated.slice(existingRows.length))
            return
        }

        if (findDuplicateKeys(allRows)) {
            errorToast('Each reference must use a different key. Remove duplicate key selections.')
            return
        }

        const payload = buildReferencePayload(allRows)

        startTransition(async () => {
            try {
                const res = await fetch(API_ROUTES.FEATURE_REFERENCES(data?.featureName ?? ''), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ references: payload }),
                })

                if (res.ok) {
                    successToast('References saved successfully.')
                    await mutate()
                    onOpenChange(false)
                } else {
                    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
                    errorToast((body.error as string) ?? 'Failed to save references.')
                }
            } catch {
                errorToast('An unexpected error occurred.')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className='sm:max-w-[60vw] max-h-[85vh] flex flex-col'>
                <DialogHeader>
                    <DialogTitle>Edit Reference Keys</DialogTitle>
                </DialogHeader>

                <div className='flex-1 overflow-y-auto space-y-4 py-2'>
                    {existingRows.length > 0 && (
                        <div className='space-y-3'>
                            <p className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                                Existing Mappings
                            </p>
                            <GridContainer spacing={6}>
                                {existingRows.map((row, i) => (
                                    <ReferenceMappingRow key={i} fields={row} row={i} onUpdate={handleExistingUpdate} onRemove={handleRemoveExisting} />
                                ))}
                            </GridContainer>
                        </div>
                    )}

                    <div className='space-y-2 py-4'>
                        <p className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                            Add New Reference
                        </p>
                        <GridContainer spacing={6}>
                            {newRows.map((row, i) => (
                                <ReferenceMappingRow key={i} fields={row} row={i} onUpdate={handleNewUpdate} onRemove={handleRemoveNew} />
                            ))}
                        </GridContainer>

                        <GridItem size={{ xs: 2 }} className='mt-4'>
                            <Button className='ml-auto text-xs' onClick={handleAddNew}>
                                Add New Reference
                            </Button>
                        </GridItem>
                    </div>
                </div>

                <Separator />
                <div className='flex justify-end gap-3 pt-2'>
                    <Button variant='outline' onClick={handleClose} disabled={isPending}>
                        Close
                    </Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : null}
                        Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}