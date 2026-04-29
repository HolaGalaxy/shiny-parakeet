'use client'

import type { KeyedMutator } from 'swr'
import { Loader2 } from 'lucide-react'

import { type FooterRenderProps, JsonEditorDialog } from '@/components/shared/JsonEditorDialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { FeatureFieldRow, FeatureFieldsResponse } from '@/types/feature'
import { errorToast } from '@/utils/toast'
import { useFeatureFieldEditing } from './FeatureDetails/useFeatureFieldEditing'
import FeatureFieldValueInput from './FeatureDetails/FeatureFieldValueInput'

type Props = {
  featureName: string
  data: FeatureFieldsResponse | undefined
  mutate: KeyedMutator<FeatureFieldsResponse>
}

export default function FeatureKeysCard({ featureName, data, mutate }: Props) {
  const {
    localFields, isPending, isDirty,
    editorState, updateFieldValue, openJsonEditor,
    closeJsonEditor, applyJsonDraft,
    resetAll, saveAll,
  } = useFeatureFieldEditing({ featureName, data, mutate })

  return (
    <div className='p-5'>
      <h3 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1'>
        Feature Keys
      </h3>
      <Separator className='mb-4' />

      {localFields.length === 0 ? (
        <p className='text-sm text-muted-foreground italic py-4'>
          No fields defined yet. Add fields from the schema page.
        </p>
      ) : (
        <div className='flex flex-col gap-3 py-4 w-full max-w-5xl overflow-x-hidden'>
          {localFields.map((field) => (
            field.reference !== null ? null : (
              <div key={field.schemaFieldId} className='flex items-center gap-4 text-[15px] w-full'>
                <div className='flex items-center shrink-0'>
                  <p className='font-semibold text-foreground'>{field.name}</p>
                  <span className='ml-1 text-foreground'>:</span>
                </div>
                <div className='flex-1 flex items-center gap-3 min-w-0'>
                  <FeatureFieldValueInput
                    field={field}
                    disabled={field.reference !== null}
                    onValueChange={updateFieldValue}
                    onJsonClick={openJsonEditor}
                  />
                </div>
              </div>
            )
          ))}
        </div>
      )}

      <div className='flex justify-end gap-3 pt-4'>
        <Button
          variant='outline'
          onClick={resetAll}
          disabled={isPending || !isDirty}
        >
          Cancel
        </Button>
        <Button onClick={saveAll} disabled={isPending || !isDirty}>
          {isPending ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : null}
          Save
        </Button>
      </div>

      <JsonEditorDialog
        state={editorState}
        onOpenChange={(open) => { if (!open) closeJsonEditor() }}
        renderFooter={({ draft, setDraft, initialString, isValueChanged }: FooterRenderProps & { isValueChanged: boolean }) => (
          <div className='flex justify-between pt-2'>
            <Button variant='ghost' size='sm'
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
              <Button variant='destructive' className='rounded-full text-white' disabled={!isValueChanged} onClick={() => setDraft(initialString)}>
                Reset
              </Button>
              <Button className='rounded-full text-white' disabled={!isValueChanged} onClick={() => applyJsonDraft(draft)}>
                Save
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  )
}