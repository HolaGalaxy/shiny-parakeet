import { JsonEditor } from '@/components/shared/JsonEditor'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { type ReactNode, useEffect, useRef, useState } from 'react'

type ModalValue = string | number | boolean | Record<string, unknown> | unknown[] | object | null

function toJsonString(val: ModalValue): string {
  try {
    if (val === null || val === undefined) return ''
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2)
  } catch {
    return ''
  }
}

export type FooterRenderProps = {
  draft: string
  setDraft: (value: string) => void
  initialString: string
}

type JsonEditorDialogProps = {
  state: { open: boolean; value: ModalValue; id: string; name?: string }
  onOpenChange: (open: boolean) => void
  readOnly?: boolean
  renderHeader?: (props: { name: string }) => ReactNode
  renderFooter?: (props: FooterRenderProps & { isValueChanged: boolean }) => ReactNode
}

export function JsonEditorDialog({
  state,
  readOnly = false,
  onOpenChange,
  renderHeader,
  renderFooter,
}: JsonEditorDialogProps) {
  const initialString = toJsonString(state.value)
  const [draft, setDraft] = useState('')
  const isValueChangedRef = useRef(false)

  const handleDraftChange = (value: string) => {
    setDraft(value)
    isValueChangedRef.current = true
  }

  useEffect(() => {
    if (state.open) setDraft(initialString)
  }, [state.open])

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[80vw] max-h-[85vh] flex flex-col'>
        {renderHeader ? (
          renderHeader({ name: state.name ?? '' })
        ) : (
          <DialogHeader>
            <DialogTitle>{state.name ? `Edit JSON — ${state.name}` : 'Edit JSON'}</DialogTitle>
          </DialogHeader>
        )}

        <JsonEditor
          value={draft}
          onChange={handleDraftChange}
          readOnly={readOnly}
        />

        {renderFooter && renderFooter({ draft, setDraft, initialString, isValueChanged: isValueChangedRef.current })}
      </DialogContent>
    </Dialog>
  )
}
