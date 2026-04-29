import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { useTheme } from 'next-themes'

type JsonEditorProps = {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function JsonEditor({ value, onChange, readOnly = false }: JsonEditorProps) {
  const { resolvedTheme } = useTheme()
  return (
    <div className='flex-1 min-h-0 overflow-hidden rounded-md border border-border'>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={[json()]}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          indentOnInput: true,
        }}
        height='60vh'
        width='100%'
        className='text-sm'
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  )
}
