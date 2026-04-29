import { type Field, FieldName, FieldType } from '@/types/field'
import { extractFieldValue } from '@/utils/type-guards'
import * as React from 'react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

type BP = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SPAN_MAP: Record<BP, Record<number, string>> = {
  xs: { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4', 5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8', 9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12' },
  sm: { 1: 'sm:col-span-1', 2: 'sm:col-span-2', 3: 'sm:col-span-3', 4: 'sm:col-span-4', 5: 'sm:col-span-5', 6: 'sm:col-span-6', 7: 'sm:col-span-7', 8: 'sm:col-span-8', 9: 'sm:col-span-9', 10: 'sm:col-span-10', 11: 'sm:col-span-11', 12: 'sm:col-span-12' },
  md: { 1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4', 5: 'md:col-span-5', 6: 'md:col-span-6', 7: 'md:col-span-7', 8: 'md:col-span-8', 9: 'md:col-span-9', 10: 'md:col-span-10', 11: 'md:col-span-11', 12: 'md:col-span-12' },
  lg: { 1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4', 5: 'lg:col-span-5', 6: 'lg:col-span-6', 7: 'lg:col-span-7', 8: 'lg:col-span-8', 9: 'lg:col-span-9', 10: 'lg:col-span-10', 11: 'lg:col-span-11', 12: 'lg:col-span-12' },
  xl: { 1: 'xl:col-span-1', 2: 'xl:col-span-2', 3: 'xl:col-span-3', 4: 'xl:col-span-4', 5: 'xl:col-span-5', 6: 'xl:col-span-6', 7: 'xl:col-span-7', 8: 'xl:col-span-8', 9: 'xl:col-span-9', 10: 'xl:col-span-10', 11: 'xl:col-span-11', 12: 'xl:col-span-12' },
}

const SPACING_TO_GAP: Record<number, string> = {
  0: 'gap-0', 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 5: 'gap-5',
  6: 'gap-6', 7: 'gap-7', 8: 'gap-8', 9: 'gap-9', 10: 'gap-10',
}

export type GridSize = Partial<Record<BP, number>>

function gridItemClass(size: GridSize): string {
  const parts: string[] = []
  for (const bp of ['xs', 'sm', 'md', 'lg', 'xl'] as BP[]) {
    const val = size[bp]
    if (val != null) parts.push(SPAN_MAP[bp][val] ?? SPAN_MAP.xs[12]!)
  }
  if (parts.length === 0) parts.push(SPAN_MAP.xs[12]!)
  return parts.join(' ')
}

export type GridItemProps = React.HTMLAttributes<HTMLDivElement> & {
  size: GridSize
  children: React.ReactNode
}

export type GridContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  spacing?: number
  children: React.ReactNode
}

export function GridContainer({ spacing = 2, className, children, ...rest }: GridContainerProps) {
  const gap = SPACING_TO_GAP[spacing] ?? SPACING_TO_GAP[2]
  return (
    <div className={['grid grid-cols-12', gap, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  )
}

export function GridItem({ size, className, children, ...rest }: GridItemProps) {
  return (
    <div className={[gridItemClass(size), className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  )
}

export type GetFieldWithGridItemProps = {
  field: Field
  onUpdate: (name: FieldName, value: string, field: Field, additionalData?: any) => void
  additionalData?: any
}

export function GetFieldWithGridItem({ field, onUpdate, additionalData }: GetFieldWithGridItemProps) {
  switch (field.type) {
    case FieldType.Text:
    case FieldType.Email:
    case FieldType.Password:
      return <GetTextFieldWithGridItem field={field} onUpdate={onUpdate} additionalData={additionalData} />
    case FieldType.Textarea:
      return <GetTextareaWithGridItem field={field} onUpdate={onUpdate} additionalData={additionalData} />
    case FieldType.Select:
      return <GetSelectWithGridItem field={field} onUpdate={onUpdate} additionalData={additionalData} />
  }
}

function FieldError({ field }: { field: Field }) {
  if (!field.error || field.errors == null || field.errorIdx == null) return null
  return (
    <div className='mt-[2px]'>
      <p className='text-xs text-rose-400'>{field.errors[field.errorIdx]}</p>
    </div>
  )
}

function GetTextFieldWithGridItem({ field, onUpdate, additionalData }: GetFieldWithGridItemProps) {
  const onHandleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(field.name, e.target.value, field, additionalData),
    [field, onUpdate, additionalData],
  )

  return (
    <GridItem key={`${field.name}-${field.index}`} size={{ xs: field.xs, sm: field.sm, md: field.md, lg: field.lg, xl: field.xl }}>
      <div className='flex flex-col gap-2'>
        <div className='block'>
          <Label htmlFor={field.name} className='font-medium'>
            {field.label}{field.required ? '*' : ''}
          </Label>
        </div>
        <Input
          id={field.name}
          type={field.type}
          placeholder={field.placeholder}
          required={field.required}
          name={field.name}
          variant={field.variant}
          value={extractFieldValue(field.value)}
          onChange={onHandleInputChange}
          disabled={field.disabled}
        />
      </div>
      <FieldError field={field} />
    </GridItem>
  )
}

function GetTextareaWithGridItem({ field, onUpdate, additionalData }: GetFieldWithGridItemProps) {
  const onHandleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate(field.name, e.target.value, field, additionalData),
    [field, onUpdate, additionalData],
  )

  return (
    <GridItem key={`${field.name}-${field.index}`} size={{ xs: field.xs, sm: field.sm, md: field.md, lg: field.lg, xl: field.xl }}>
      <div className='flex flex-col gap-2'>
        <div className='block'>
          <Label htmlFor={field.name} className='font-medium'>
            {field.label}{field.required ? '*' : ''}
          </Label>
        </div>
        <Textarea
          id={field.name}
          placeholder={field.placeholder}
          required={field.required}
          name={field.name}
          value={extractFieldValue(field.value)}
          onChange={onHandleInputChange}
          rows={field.rows}
          className={field.error ? `${field.className ?? ''} border-text-charcoal text-text-charcoal focus-visible:text-charcoal` : field.className}
        />
      </div>
      <FieldError field={field} />
    </GridItem>
  )
}

function GetSelectWithGridItem({ field, onUpdate, additionalData }: GetFieldWithGridItemProps) {
  const currentValue = extractFieldValue(field.value)

  const onHandleSelectChange = React.useCallback(
    (value: string) => onUpdate(field.name, value, field, additionalData),
    [field, onUpdate, additionalData],
  )

  return (
    <GridItem key={`${field.name}-${field.index}`} size={{ xs: field.xs, sm: field.sm, md: field.md, lg: field.lg, xl: field.xl }}>
      <div className='flex flex-col gap-2'>
        <div className='block'>
          <Label htmlFor={field.name} className='font-medium'>
            {field.label}{field.required ? '*' : ''}
          </Label>
        </div>
        <Select value={currentValue} onValueChange={onHandleSelectChange} disabled={field.disabled}>
          <SelectTrigger className='h-10! w-full border-ld bg-transparent text-ld focus:border-primary focus:ring-0'>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt.id} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <FieldError field={field} />
    </GridItem>
  )
}
