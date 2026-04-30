import { AuditAction, FieldValueType, type Prisma } from '@prisma/client'
import { z } from 'zod'
import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { prisma } from '@/lib/db/prisma'
import { HttpError } from '@/lib/http/http-error'
import { switchIdentifierSchema } from '@/lib/validation/identifiers'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import { isPrismaUniqueViolation } from '@/utils/type-guards'
import type { SessionUser } from '@/types/auth'

// ─── Validation ─────────────────────────────────────────────────────────────

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
type Literal = z.infer<typeof literalSchema>
type Json = Literal | { [key: string]: Json } | Json[]
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(z.string(), jsonSchema)])
)

const baseFields = { name: switchIdentifierSchema }

export const createFieldInput = z.discriminatedUnion('valueType', [
  z.object({ ...baseFields, valueType: z.literal(FieldValueType.STRING), defaultValue: z.string() }),
  z.object({ ...baseFields, valueType: z.literal(FieldValueType.NUMBER), defaultValue: z.number() }),
  z.object({ ...baseFields, valueType: z.literal(FieldValueType.BOOLEAN), defaultValue: z.boolean() }),
  z.object({ ...baseFields, valueType: z.literal(FieldValueType.ARRAY), defaultValue: z.array(jsonSchema) }),
  z.object({ ...baseFields, valueType: z.literal(FieldValueType.OBJECT), defaultValue: z.record(z.string(), jsonSchema) }),
])

export type CreateFieldInput = z.infer<typeof createFieldInput>

// ─── DTOs ───────────────────────────────────────────────────────────────────

export type SchemaFieldDTO = {
  id: string
  name: string
  valueType: string
  defaultValue: unknown
  createdAt: Date
}

// ─── Service ────────────────────────────────────────────────────────────────

export const SchemaFieldService = {
  async create(session: SessionUser, schemaName: string, input: CreateFieldInput): Promise<SchemaFieldDTO> {
    const schema = await prisma.schema.findUnique({ where: { name: schemaName }, select: { id: true } })
    if (!schema) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.SCHEMA_NOT_FOUND, 'NOT_FOUND')
    }

    try {
      const field = await prisma.schemaField.create({
        data: {
          schemaId: schema.id,
          name: input.name,
          valueType: input.valueType,
          defaultValue: input.defaultValue as Prisma.InputJsonValue,
        },
        select: { id: true, name: true, valueType: true, defaultValue: true, createdAt: true },
      })

      await writeAudit({
        actorUserId: session.id,
        actorEmail: session.email,
        entityType: AuditEntity.SCHEMA_FIELD,
        entityId: field.id,
        action: AuditAction.CREATE,
        payload: { schemaName, fieldName: field.name },
      })

      return field
    } catch (e: unknown) {
      if (isPrismaUniqueViolation(e)) {
        throw new HttpError(HttpStatus.CONFLICT, ERROR_MSG.FIELD_NAME_EXISTS, 'UNIQUE_VIOLATION')
      }
      throw e
    }
  },

  async delete(session: SessionUser, schemaName: string, fieldId: string): Promise<{ ok: true }> {
    const field = await prisma.schemaField.findFirst({
      where: { id: fieldId, schema: { name: schemaName } },
      select: { id: true, name: true },
    })

    if (!field) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.FIELD_NOT_FOUND, 'NOT_FOUND')
    }

    await prisma.schemaField.delete({ where: { id: field.id } })

    await writeAudit({
      actorUserId: session.id,
      actorEmail: session.email,
      entityType: AuditEntity.SCHEMA_FIELD,
      entityId: field.id,
      action: AuditAction.DELETE,
      payload: { schemaName, fieldName: field.name },
    })

    return { ok: true }
  },
} as const
