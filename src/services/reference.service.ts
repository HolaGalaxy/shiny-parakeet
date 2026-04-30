import { AuditAction, Prisma } from '@prisma/client'
import { z } from 'zod'
import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { prisma } from '@/lib/db/prisma'
import { HttpError } from '@/lib/http/http-error'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import { isPrismaUniqueViolation } from '@/utils/type-guards'
import type { SessionUser } from '@/types/auth'

// ─── Validation ─────────────────────────────────────────────────────────────

const referenceItemSchema = z.object({
  consumerSchemaFieldId: z.string().uuid(),
  targetFeatureId: z.string().uuid(),
  targetSchemaFieldId: z.string().uuid(),
})

export const syncReferencesInput = z.object({
  references: z.array(referenceItemSchema),
})

export type SyncReferencesInput = z.infer<typeof syncReferencesInput>
type DesiredRef = z.infer<typeof referenceItemSchema>

// ─── DTOs ───────────────────────────────────────────────────────────────────

export type SyncReferencesResult = {
  created: number
  updated: number
  deleted: number
}

// ─── Service ────────────────────────────────────────────────────────────────

export const ReferenceService = {
  async sync(
    session: SessionUser,
    featureName: string,
    input: SyncReferencesInput,
  ): Promise<SyncReferencesResult> {
    const { references: desired } = input

    const seenConsumerFields = new Set<string>()
    for (const ref of desired) {
      if (seenConsumerFields.has(ref.consumerSchemaFieldId)) {
        throw new HttpError(
          HttpStatus.BAD_REQUEST,
          ERROR_MSG.VALIDATION_FAILED,
          'DUPLICATE_CONSUMER_FIELD',
        )
      }
      seenConsumerFields.add(ref.consumerSchemaFieldId)
    }

    const consumerSchema = await prisma.schema.findUnique({
      where: { name: featureName },
      include: {
        feature: {
          include: {
            referencesOutbound: {
              select: {
                id: true,
                consumerSchemaFieldId: true,
                targetFeatureId: true,
                targetSchemaFieldId: true,
              },
            },
          },
        },
        fields: { select: { id: true } },
      },
    })

    if (!consumerSchema?.feature) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.FEATURE_NOT_FOUND, 'NOT_FOUND')
    }

    const consumerFeatureId = consumerSchema.feature.id
    const consumerFieldIdSet = new Set(consumerSchema.fields.map((f) => f.id))
    const existingRefs = consumerSchema.feature.referencesOutbound

    for (const ref of desired) {
      if (!consumerFieldIdSet.has(ref.consumerSchemaFieldId)) {
        throw new HttpError(
          HttpStatus.BAD_REQUEST,
          ERROR_MSG.CONSUMER_FIELD_INVALID,
          'INVALID_CONSUMER_FIELD',
        )
      }
      if (ref.targetFeatureId === consumerFeatureId) {
        throw new HttpError(
          HttpStatus.BAD_REQUEST,
          ERROR_MSG.REFERENCE_SELF,
          'SELF_REFERENCE',
        )
      }
    }

    // ── Build diff ──
    const existingMap = new Map(existingRefs.map((r) => [r.consumerSchemaFieldId, r]))
    const desiredMap = new Map(desired.map((d) => [d.consumerSchemaFieldId, d]))

    const toDelete: string[] = []
    const toCreate: DesiredRef[] = []
    const toUpdate: { id: string; ref: DesiredRef }[] = []

    for (const [fieldId, existing] of existingMap) {
      if (!desiredMap.has(fieldId)) {
        toDelete.push(existing.id)
      }
    }

    for (const [fieldId, ref] of desiredMap) {
      const existing = existingMap.get(fieldId)
      if (!existing) {
        toCreate.push(ref)
      } else if (
        existing.targetFeatureId !== ref.targetFeatureId ||
        existing.targetSchemaFieldId !== ref.targetSchemaFieldId
      ) {
        toUpdate.push({ id: existing.id, ref })
      }
    }

    if (toDelete.length === 0 && toCreate.length === 0 && toUpdate.length === 0) {
      return { created: 0, updated: 0, deleted: 0 }
    }

    // ── Validate targets ──
    const refsNeedingValidation = [...toCreate, ...toUpdate.map((u) => u.ref)]
    if (refsNeedingValidation.length > 0) {
      const targetFieldIds = [...new Set(refsNeedingValidation.map((r) => r.targetSchemaFieldId))]
      const targetFeatureIds = [...new Set(refsNeedingValidation.map((r) => r.targetFeatureId))]

      const [validFields, validFeatures, overrides] = await Promise.all([
        prisma.schemaField.findMany({
          where: { id: { in: targetFieldIds } },
          select: { id: true, schemaId: true },
        }),
        prisma.feature.findMany({
          where: { id: { in: targetFeatureIds } },
          select: { id: true, schemaId: true },
        }),
        toCreate.length > 0
          ? prisma.featureFieldValue.findMany({
              where: {
                schemaFieldId: { in: toCreate.map((c) => c.consumerSchemaFieldId) },
                value: { not: Prisma.JsonNull },
              },
              select: { schemaFieldId: true },
            })
          : [],
      ])

      if (overrides.length > 0) {
        throw new HttpError(
          HttpStatus.BAD_REQUEST,
          ERROR_MSG.REFERENCE_VALUE_CONFLICT,
          'VALUE_CONFLICT',
        )
      }

      const featureSchemaMap = new Map(validFeatures.map((f) => [f.id, f.schemaId]))
      const fieldSchemaMap = new Map(validFields.map((f) => [f.id, f.schemaId]))

      for (const ref of refsNeedingValidation) {
        const featureSchemaId = featureSchemaMap.get(ref.targetFeatureId)
        if (!featureSchemaId) {
          throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.TARGET_NOT_FOUND, 'TARGET_NOT_FOUND')
        }
        const fieldSchemaId = fieldSchemaMap.get(ref.targetSchemaFieldId)
        if (!fieldSchemaId) {
          throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.TARGET_FIELD_NOT_FOUND, 'TARGET_FIELD_NOT_FOUND')
        }
        if (featureSchemaId !== fieldSchemaId) {
          throw new HttpError(
            HttpStatus.BAD_REQUEST,
            ERROR_MSG.TARGET_FIELD_NOT_FOUND,
            'FIELD_FEATURE_MISMATCH',
          )
        }
      }
    }

    // ── Atomic transaction ──
    try {
      const result = await prisma.$transaction(async (tx) => {
        let deletedCount = 0
        if (toDelete.length > 0) {
          const { count } = await tx.fieldReference.deleteMany({
            where: { id: { in: toDelete } },
          })
          deletedCount = count
        }

        let updatedCount = 0
        for (const { id, ref } of toUpdate) {
          await tx.fieldReference.update({
            where: { id },
            data: {
              targetFeatureId: ref.targetFeatureId,
              targetSchemaFieldId: ref.targetSchemaFieldId,
            },
          })
          updatedCount++
        }

        let createdCount = 0
        for (const ref of toCreate) {
          await tx.fieldReference.create({
            data: {
              consumerFeatureId,
              consumerSchemaFieldId: ref.consumerSchemaFieldId,
              targetFeatureId: ref.targetFeatureId,
              targetSchemaFieldId: ref.targetSchemaFieldId,
            },
          })
          createdCount++
        }

        return { created: createdCount, updated: updatedCount, deleted: deletedCount }
      })

      // Audit (best-effort, outside transaction)
      const auditOps = [
        ...toDelete.map((refId) =>
          writeAudit({
            actorUserId: session.id,
            actorEmail: session.email,
            entityType: AuditEntity.FIELD_REFERENCE,
            entityId: refId,
            action: AuditAction.DELETE,
            payload: { featureName },
          }),
        ),
        ...toUpdate.map(({ id }) =>
          writeAudit({
            actorUserId: session.id,
            actorEmail: session.email,
            entityType: AuditEntity.FIELD_REFERENCE,
            entityId: id,
            action: AuditAction.UPDATE,
            payload: { featureName },
          }),
        ),
        ...toCreate.map((ref) =>
          writeAudit({
            actorUserId: session.id,
            actorEmail: session.email,
            entityType: AuditEntity.FIELD_REFERENCE,
            entityId: consumerFeatureId,
            action: AuditAction.CREATE,
            payload: { featureName, consumerSchemaFieldId: ref.consumerSchemaFieldId },
          }),
        ),
      ]

      if (auditOps.length > 0) {
        await Promise.allSettled(auditOps)
      }

      return result
    } catch (e: unknown) {
      if (isPrismaUniqueViolation(e)) {
        throw new HttpError(HttpStatus.CONFLICT, 'Reference constraint violation', 'UNIQUE_VIOLATION')
      }
      throw e
    }
  },

  async deleteReference(
    session: SessionUser,
    featureName: string,
    referenceId: string,
  ): Promise<{ ok: true }> {
    const ref = await prisma.fieldReference.findUnique({
      where: { id: referenceId },
      include: { consumerFeature: { include: { schema: { select: { name: true } } } } },
    })

    if (!ref || ref.consumerFeature.schema.name !== featureName) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.REFERENCE_NOT_FOUND, 'NOT_FOUND')
    }

    await prisma.fieldReference.delete({ where: { id: ref.id } })

    await writeAudit({
      actorUserId: session.id,
      actorEmail: session.email,
      entityType: AuditEntity.FIELD_REFERENCE,
      entityId: ref.id,
      action: AuditAction.DELETE,
      payload: { featureName },
    })

    return { ok: true }
  },
} as const
