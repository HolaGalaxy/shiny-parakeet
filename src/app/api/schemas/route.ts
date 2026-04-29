import { AuditAction } from '@prisma/client'
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

const createSchemaBody = z.object({ name: switchIdentifierSchema })

export async function GET() {
  try {
    await requireSession()
    const rows = await prisma.schema.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, name: true, createdAt: true, updatedAt: true,
        _count: { select: { fields: true } },
      },
    })
    return jsonOk({
      schemas: rows.map((r) => ({
        id: r.id, name: r.name, createdAt: r.createdAt, updatedAt: r.updatedAt,
        fieldCount: r._count.fields,
      })),
    })
  } catch (e: unknown) {
    return jsonError(e)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()

    let json: unknown
    try { json = await request.json() } catch {
      throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.INVALID_JSON, 'INVALID_JSON')
    }

    const parsed = createSchemaBody.safeParse(json)
    if (!parsed.success) {
      throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.VALIDATION_FAILED, 'VALIDATION', parsed.error.flatten())
    }

    const { name } = parsed.data

    const result = await prisma.$transaction(async (tx) => {
      const schema = await tx.schema.create({
        data: { name, description: '' },
        select: { id: true, name: true, createdAt: true, updatedAt: true },
      })
      await tx.feature.create({ data: { schemaId: schema.id } })
      return schema
    })

    await writeAudit({
      actorUserId: session.id, actorEmail: session.email,
      entityType: AuditEntity.SCHEMA, entityId: result.id,
      action: AuditAction.CREATE, payload: { name: result.name },
    })

    return jsonOk({ schema: result }, HttpStatus.CREATED)
  } catch (e: unknown) {
    if (isPrismaUniqueViolation(e)) {
      return jsonError(new HttpError(HttpStatus.CONFLICT, ERROR_MSG.SCHEMA_NAME_EXISTS, 'UNIQUE_VIOLATION'))
    }
    return jsonError(e)
  }
}
