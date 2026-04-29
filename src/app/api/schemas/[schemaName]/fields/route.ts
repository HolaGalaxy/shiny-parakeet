import { AuditAction, FieldValueType, type Prisma } from '@prisma/client'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { requireSession } from '@/lib/auth/require-session'
import { prisma } from '@/lib/db/prisma'
import { HttpError, jsonError, jsonOk } from '@/lib/http/http-error'
import { switchIdentifierSchema } from '@/lib/validation/identifiers'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import { isPrismaUniqueViolation } from '@/utils/type-guards'


const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(z.string(), jsonSchema),])
);

const baseFields = {
  name: switchIdentifierSchema,
}

const createFieldBody = z.discriminatedUnion('valueType', [
  z.object({
    ...baseFields,
    valueType: z.literal(FieldValueType.STRING),
    defaultValue: z.string(),
  }),
  z.object({
    ...baseFields,
    valueType: z.literal(FieldValueType.NUMBER),
    defaultValue: z.number(),
  }),
  z.object({
    ...baseFields,
    valueType: z.literal(FieldValueType.BOOLEAN),
    defaultValue: z.boolean(),
  }),
  z.object({
    ...baseFields,
    valueType: z.literal(FieldValueType.ARRAY),
    defaultValue: z.array(jsonSchema), 
  }),
  z.object({
    ...baseFields,
    valueType: z.literal(FieldValueType.OBJECT),
    defaultValue: z.record(z.string(), jsonSchema), 
  }),
])

type Params = { schemaName: string }

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const session = await requireSession()
    const { schemaName } = await context.params

    let json: unknown
    try { json = await request.json() } catch {
      throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.INVALID_JSON, 'INVALID_JSON')
    }

    const parsed = createFieldBody.safeParse(json)
    if (!parsed.success) {
      throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.VALIDATION_FAILED, 'VALIDATION', parsed.error.flatten())
    }

    const schema = await prisma.schema.findUnique({ where: { name: schemaName }, select: { id: true } })
    if (!schema) throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.SCHEMA_NOT_FOUND, 'NOT_FOUND')

    const { name, valueType, defaultValue } = parsed.data

    const field = await prisma.schemaField.create({
      data: { schemaId: schema.id, name, valueType, defaultValue: defaultValue as Prisma.InputJsonValue },
      select: { id: true, name: true, valueType: true, defaultValue: true, createdAt: true },
    })

    await writeAudit({
      actorUserId: session.id, actorEmail: session.email,
      entityType: AuditEntity.SCHEMA_FIELD, entityId: field.id,
      action: AuditAction.CREATE, payload: { schemaName, fieldName: field.name },
    })

    return jsonOk({ field }, HttpStatus.CREATED)
  } catch (e: unknown) {
    if (isPrismaUniqueViolation(e)) {
      return jsonError(new HttpError(HttpStatus.CONFLICT, ERROR_MSG.FIELD_NAME_EXISTS, 'UNIQUE_VIOLATION'))
    }
    return jsonError(e)
  }
}
