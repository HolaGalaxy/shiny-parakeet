import { AuditAction, type Prisma } from '@prisma/client'
import { z } from 'zod'
import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { prisma } from '@/lib/db/prisma'
import { HttpError } from '@/lib/http/http-error'
import { switchIdentifierSchema } from '@/lib/validation/identifiers'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import { isPrismaUniqueViolation } from '@/utils/type-guards'
import type { SessionUser } from '@/types/auth'
import type { SchemaRow } from '@/types/schema'

// ─── Validation Schemas ─────────────────────────────────────────────────────

export const createSchemaInput = z.object({
  name: switchIdentifierSchema,
  description: z.string().default(''),
})

export type CreateSchemaInput = z.infer<typeof createSchemaInput>

// ─── DTOs ───────────────────────────────────────────────────────────────────

export type SchemaListItemDTO = {
  id: string
  name: string
  createdAt: string | Date
  updatedAt: string | Date
  fieldCount: number
}

export type SchemaDetailDTO = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  featureId: string
  fields: Array<{
    id: string
    name: string
    valueType: string
    defaultValue: unknown
    createdAt: Date
  }>
}

export type CreateSchemaDTO = {
  id: string
  name: string
  description: string
  createdAt: Date
}

export type DeleteSchemaDTO = {
  id: string
  name: string
  description: string
}

// ─── Service ────────────────────────────────────────────────────────────────

export const SchemaService = {
  async list(): Promise<SchemaListItemDTO[]> {
    const rows = await prisma.schema.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { fields: true } },
      },
    })

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      fieldCount: r._count.fields,
    }))
  },

  async listSimple(): Promise<SchemaRow[]> {
    const rows = await prisma.schema.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, description: true, name: true, createdAt: true },
    })

    return rows.map(({ createdAt, ...rest }) => ({
      ...rest,
      createdAt: new Date(createdAt).toISOString(),
    }))
  },

  async getDetail(schemaName: string): Promise<SchemaDetailDTO> {
    const schema = await prisma.schema.findUnique({
      where: { name: schemaName },
      include: {
        fields: { orderBy: { createdAt: 'asc' } },
        feature: { select: { id: true } },
      },
    })

    if (!schema || !schema.feature) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.SCHEMA_NOT_FOUND, 'NOT_FOUND')
    }

    return {
      id: schema.id,
      name: schema.name,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
      featureId: schema.feature.id,
      fields: schema.fields.map((f) => ({
        id: f.id,
        name: f.name,
        valueType: f.valueType,
        defaultValue: f.defaultValue,
        createdAt: f.createdAt,
      })),
    }
  },

  async create(session: SessionUser, input: CreateSchemaInput): Promise<CreateSchemaDTO> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const schema = await tx.schema.create({
          data: { name: input.name, description: input.description },
          select: { id: true, name: true, description: true, createdAt: true },
        })

        await tx.feature.create({ data: { schemaId: schema.id } })

        await writeAudit(
          {
            actorUserId: session.id,
            actorEmail: session.email,
            entityType: AuditEntity.SCHEMA,
            entityId: schema.id,
            action: 'CREATE' as AuditAction,
            payload: { name: schema.name },
          },
          tx,
        )

        return schema
      })

      return result
    } catch (e: unknown) {
      if (isPrismaUniqueViolation(e)) {
        throw new HttpError(HttpStatus.CONFLICT, ERROR_MSG.SCHEMA_NAME_EXISTS, 'UNIQUE_VIOLATION')
      }
      throw e
    }
  },

  async delete(session: SessionUser, schemaName: string): Promise<DeleteSchemaDTO> {
    const existing = await prisma.schema.findUnique({
      where: { name: schemaName },
      select: { id: true, name: true, description: true },
    })

    if (!existing) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.SCHEMA_NOT_FOUND, 'NOT_FOUND')
    }

    await prisma.schema.delete({ where: { id: existing.id } })

    await writeAudit({
      actorUserId: session.id,
      actorEmail: session.email,
      entityType: AuditEntity.SCHEMA,
      entityId: existing.id,
      action: 'DELETE' as AuditAction,
      payload: { name: existing.name },
    })

    return existing
  },

  async deleteById(session: SessionUser, id: string): Promise<DeleteSchemaDTO> {
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
          action: 'DELETE' as AuditAction,
          payload: { name: schema.name },
        },
        tx,
      )

      return schema
    })

    return result
  },
} as const
