import { useEffect, useState, useTransition } from 'react'
import type { KeyedMutator } from 'swr'
import { API_ROUTES } from '@/constants/routes'
import type { FeatureFieldRow, FeatureFieldsResponse } from '@/types/feature'
import { errorToast, successToast } from '@/utils/toast'

type ModalValue = string | number | boolean | Record<string, unknown> | unknown[] | object | null
type EditorState = { open: boolean; value: ModalValue; id: string; name: string }
const EDITOR_CLOSED: EditorState = { open: false, value: null, id: '', name: '' }

export type { EditorState }
export { EDITOR_CLOSED }

type Params = {
    featureName: string
    data: FeatureFieldsResponse | undefined
    mutate: KeyedMutator<FeatureFieldsResponse>
}

export function useFeatureFieldEditing({ featureName, data, mutate }: Params) {
    const [localFields, setLocalFields] = useState<FeatureFieldRow[]>(data?.fields ?? [])
    const [isPending, startTransition] = useTransition()
    const [editorState, setEditorState] = useState<EditorState>(EDITOR_CLOSED)

    useEffect(() => {
        setLocalFields(data?.fields ?? [])
    }, [data])

    const dirtyIds = (() => {
        const set = new Set<string>()
        for (const local of localFields) {
            const original = data?.fields.find((f) => f.schemaFieldId === local.schemaFieldId)
            if (!original) continue
            if (JSON.stringify(local.effectiveValue) !== JSON.stringify(original.effectiveValue)) {
                set.add(local.schemaFieldId)
            }
        }
        return set
    })()

    const isDirty = dirtyIds.size > 0

    const updateFieldValue = (schemaFieldId: string, value: unknown) => {
        setLocalFields((prev) => prev.map((f) => f.schemaFieldId === schemaFieldId
            ? { ...f, effectiveValue: value === '' || value === undefined ? f.defaultValue : value }
            : f,
        ),
        )
    }

    const openJsonEditor = (field: FeatureFieldRow) => {
        setEditorState({ open: true, value: field.effectiveValue as ModalValue,
            id: field.schemaFieldId, name: field.name,
        })
    }

    const closeJsonEditor = () => {
        setEditorState(EDITOR_CLOSED)
    }

    const applyJsonDraft = (draft: string) => {
        try {
            const parsed: unknown = JSON.parse(draft)
            updateFieldValue(editorState.id, parsed)
            setEditorState(EDITOR_CLOSED)
        } catch {
            errorToast('Invalid JSON — please fix before saving')
        }
    }

    const resetAll = () => {
        setLocalFields(data?.fields ?? [])
    }

    const saveAll = () => {
        if (!isDirty) return

        const fieldsToSave = localFields.filter((f) => dirtyIds.has(f.schemaFieldId))

        startTransition(async () => {
            try {
                const results = await Promise.allSettled(
                    fieldsToSave.map((f) =>
                        fetch(API_ROUTES.FEATURE_FIELD_VALUE(featureName, f.schemaFieldId), {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ value: f.effectiveValue }),
                        }).then(async (res) => {
                            if (!res.ok) {
                                const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
                                throw new Error((body.error as string) ?? `Failed to save ${f.name}`)
                            }
                            return f.name
                        }),
                    ),
                )

                const failures = results.filter(
                    (r): r is PromiseRejectedResult => r.status === 'rejected',
                )
                const successes = results.filter(
                    (r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled',
                )

                if (successes.length > 0) {
                    successToast(`Updated ${successes.length} field(s)`)
                }
                for (const f of failures) {
                    errorToast(f.reason?.message ?? 'Failed to save field')
                }

                await mutate()
            } catch {
                errorToast('Failed to save values')
            }
        })
    }

    return {
        localFields,
        isPending,
        isDirty,
        dirtyIds,
        editorState,
        updateFieldValue,
        openJsonEditor,
        closeJsonEditor,
        applyJsonDraft,
        resetAll,
        saveAll,
    }
}