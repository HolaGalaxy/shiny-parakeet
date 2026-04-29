'use client'

import { GetFieldWithGridItem, GridItem } from '@/components/compounds/Grid'
import type { Field, FieldName } from '@/types/field'
import { Icon } from '@iconify/react'

type Props = {
    fields: Field[]
    row: number
    onUpdate: (name: FieldName, value: string, field: Field, additionalData?: any) => void
    onRemove: (row: number) => void
}

export default function ReferenceMappingRow({ fields, row, onUpdate, onRemove }: Props) {
    return (
        <>
            {fields.map((fld, column) => (
                <GetFieldWithGridItem
                    key={`${fld.name}-${fld.index}`}
                    field={fld}
                    onUpdate={onUpdate}
                    additionalData={{ row, column }}
                />
            ))}
            <GridItem size={{ xs: 1 }} className='flex justify-end items-center'>
                <div
                    className='p-2 rounded-full hover:bg-red-100 transition-colors duration-200 cursor-pointer'
                    onClick={() => onRemove(row)}
                >
                    <Icon icon='solar:trash-bin-2-bold' height='28' className='text-gray-600' />
                </div>
            </GridItem>
        </>
    )
}