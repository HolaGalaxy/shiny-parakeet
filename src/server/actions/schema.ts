'use server'

import { requireSession, requireRole } from '@/lib/auth/require-session'
import { handleActionError } from '@/lib/http/http-error'
import { HttpStatus } from '@/constants/http'
import { ROUTES } from '@/constants/routes'
import { SchemaService, createSchemaInput } from '@/services/schema.service'
import type { ActionResponse } from '@/types/action'
import type { SchemaRow } from '@/types/schema'
import { revalidatePath } from 'next/cache'

type CreateSchemaSuccess = { id: string; name: string; description: string; createdAt: Date }
type DeleteSchemaSuccess = { id: string; name: string; description: string }

export async function getSchemasAction(): Promise<ActionResponse<SchemaRow[]>> {
  try {
    await requireSession()
    const data = await SchemaService.listSimple()
    return { success: true, data, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function createSchemaAction(
  data: unknown,
): Promise<ActionResponse<CreateSchemaSuccess>> {
  try {
    const session = await requireRole('SUPER_ADMIN', 'ADMIN')

    const parsed = createSchemaInput.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        code: HttpStatus.BAD_REQUEST,
        details: parsed.error.flatten() as unknown as Record<string, unknown>,
      }
    }

    const result = await SchemaService.create(session, parsed.data)

    revalidatePath(ROUTES.SCHEMAS)
    return { success: true, data: result, code: HttpStatus.CREATED }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function deleteSchemaAction(id: string): Promise<ActionResponse<DeleteSchemaSuccess>> {
  try {
    const session = await requireRole('SUPER_ADMIN', 'ADMIN')

    const result = await SchemaService.deleteById(session, id)

    revalidatePath(ROUTES.SCHEMAS)
    return { success: true, data: result, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}
