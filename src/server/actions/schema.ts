'use server'

import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { requireSession, requireRole } from '@/lib/auth/require-session'
import { prisma } from '@/lib/db/prisma'
import { handleActionError } from '@/lib/http/http-error'
import { switchIdentifierSchema } from '@/lib/validation/identifiers'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import { ROUTES } from '@/constants/routes'
import type { ActionResponse } from '@/types/action'
import type { SchemaRow } from '@/types/schema'
import type { Schema } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

type CreateSchemaSuccess = Omit<Schema, 'updatedAt'>
type DeleteSchemaSuccess = Omit<Schema, 'updatedAt' | 'createdAt'>

const createSchemaValidation = z.object({
  name: switchIdentifierSchema,
  description: z.string().default(''),
})

export async function getSchemasAction(): Promise<ActionResponse<SchemaRow[]>> {
  try {
    await requireSession()

    const rows = await prisma.schema.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, description: true, name: true, createdAt: true },
    })

    const formattedRows: SchemaRow[] = rows.map(({ createdAt, ...rest }) => ({
      ...rest,
      createdAt: new Date(createdAt).toISOString(),
    }))

    return { success: true, data: formattedRows, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function createSchemaAction(
  data: Partial<z.infer<typeof createSchemaValidation>>,
): Promise<ActionResponse<CreateSchemaSuccess>> {
  try {
    const session = await requireRole('SUPER_ADMIN', 'ADMIN')

    const parsed = createSchemaValidation.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: ERROR_MSG.VALIDATION_FAILED,
        code: HttpStatus.BAD_REQUEST,
        details: parsed.error.flatten() as unknown as Record<string, unknown>,
      }
    }
    const { name, description } = parsed.data

    const result = await prisma.$transaction(async (tx) => {
      const schema = await tx.schema.create({
        data: { name, description },
        select: { id: true, name: true, description: true, createdAt: true },
      })

      await tx.feature.create({ data: { schemaId: schema.id } })

      await writeAudit(
        {
          actorUserId: session.id,
          actorEmail: session.email,
          entityType: AuditEntity.SCHEMA,
          entityId: schema.id,
          action: 'CREATE',
          payload: { name: schema.name },
        },
        tx,
      )

      return schema
    })

    revalidatePath(ROUTES.SCHEMAS)
    return { success: true, data: result, code: HttpStatus.CREATED }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}

export async function deleteSchemaAction(id: string): Promise<ActionResponse<DeleteSchemaSuccess>> {
  try {
    const session = await requireRole('SUPER_ADMIN', 'ADMIN')

    const result = await prisma.$transaction(async (tx) => {
      const schema = await tx.schema.delete({
        where: { id },
        select: { id: true, name: true, description: true },
      })

      await writeAudit(
        {
          actorUserId: session.id,
          actorEmail: session.email,
          entityType: AuditEntity.SCHEMA,
          entityId: schema.id,
          action: 'DELETE',
          payload: { name: schema.name },
        },
        tx,
      )

      return schema
    })

    revalidatePath(ROUTES.SCHEMAS)
    return { success: true, data: result, code: HttpStatus.OK }
  } catch (error: unknown) {
    return handleActionError(error)
  }
}
