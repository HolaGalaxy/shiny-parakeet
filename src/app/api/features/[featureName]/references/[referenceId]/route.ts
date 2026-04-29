import { AuditAction } from '@prisma/client'
import { NextRequest } from 'next/server'
import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { requireSession } from '@/lib/auth/require-session'
import { prisma } from '@/lib/db/prisma'
import { HttpError, jsonError, jsonOk } from '@/lib/http/http-error'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'

type Params = { schemaName: string; referenceId: string }

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const session = await requireSession()
    const { schemaName, referenceId } = await context.params

    const ref = await prisma.fieldReference.findUnique({
      where: { id: referenceId },
      include: { consumerFeature: { include: { schema: { select: { name: true } } } } },
    })
    if (!ref || ref.consumerFeature.schema.name !== schemaName) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.REFERENCE_NOT_FOUND, 'NOT_FOUND')
    }

    await prisma.fieldReference.delete({ where: { id: ref.id } })

    await writeAudit({
      actorUserId: session.id, actorEmail: session.email,
      entityType: AuditEntity.FIELD_REFERENCE, entityId: ref.id,
      action: AuditAction.DELETE, payload: { schemaName },
    })

    return jsonOk({ ok: true })
  } catch (e: unknown) {
    return jsonError(e)
  }
}
