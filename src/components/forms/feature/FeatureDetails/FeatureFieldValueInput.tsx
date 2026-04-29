'use client'

import { Icon } from '@iconify/react'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { UnderlinedInput } from '@/components/ui/underlinedInput'
import type { FeatureFieldRow } from '@/types/feature'
import { FieldValueTypes } from '../../schema/fields/fields'

type Props = {
    field: FeatureFieldRow
    disabled?: boolean
    onValueChange: (schemaFieldId: string, value: unknown) => void
    onJsonClick: (field: FeatureFieldRow) => void
}

export default function FeatureFieldValueInput({
    field,
    disabled,
    onValueChange,
    onJsonClick,
}: Props) {
    switch (field.valueType) {
        case FieldValueTypes.BOOLEAN:
            return (
                <Switch
                    checked={Boolean(field.effectiveValue)}
                    onCheckedChange={(checked) => onValueChange(field.schemaFieldId, checked)}
                    disabled={disabled}
                />
            )

        case FieldValueTypes.OBJECT:
        case FieldValueTypes.ARRAY:
            return (
                <div className='flex items-center gap-2 w-full'>
                    <UnderlinedInput
                        value={JSON.stringify(field.effectiveValue)}
                        readOnly
                        onFocus={() => onJsonClick(field)}
                        className='cursor-pointer'
                        disabled={disabled}
                    />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Icon icon='solar:info-circle-linear' className='w-4 h-4 shrink-0' />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Click to view/edit as JSON</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )

        default:
            return (
                <UnderlinedInput
                    value={String(field.effectiveValue ?? field.defaultValue ?? '')}
                    onChange={(e) => onValueChange(field.schemaFieldId, e.target.value)}
                    disabled={disabled}
                />
            )
    }
}