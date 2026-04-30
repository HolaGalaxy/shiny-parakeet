import { AuditAction, type Prisma } from '@prisma/client'
import { z } from 'zod'
import { AuditEntity, writeAudit } from '@/lib/audit/log'
import { prisma } from '@/lib/db/prisma'
import { HttpError } from '@/lib/http/http-error'
import { resolveEffectiveJsonValues } from '@/lib/switch/effective-value'
import { ERROR_MSG } from '@/constants/errors'
import { HttpStatus } from '@/constants/http'
import type { SessionUser } from '@/types/auth'

// ─── Validation ─────────────────────────────────────────────────────────────

export const patchFieldValueInput = z.object({ value: z.unknown() })
export type PatchFieldValueInput = z.infer<typeof patchFieldValueInput>

// ─── DTOs ───────────────────────────────────────────────────────────────────

export type FeatureFieldDTO = {
  schemaFieldId: string
  name: string
  valueType: string
  defaultValue: unknown
  createdAt: Date
  effectiveValue: unknown
  reference: {
    id: string
    targetSchemaName: string
    targetFieldName: string
    targetSchemaFieldId: string
    targetFeatureId: string
  } | null
}

export type FeatureDetailDTO = {
  schemaId: string
  schemaName: string
  featureId: string
  featureName: string
  fields: FeatureFieldDTO[]
}

export type FeatureListItemDTO = {
  schemaId: string
  schemaName: string
  featureId: string
  featureName: string
  description: string
  fields: Array<{
    schemaFieldId: string
    name: string
    valueType: string
    defaultValue: unknown
    effectiveValue: unknown
    hasOverride: boolean
    createdAt: Date
  }>
  createdAt: Date
  updatedAt: Date
}

export type PublicFeatureDTO = {
  feature: string
  schemaId: string
  fields: Record<string, unknown>
}

// ─── Service ────────────────────────────────────────────────────────────────

export const FeatureService = {
  async list(): Promise<FeatureListItemDTO[]> {
    const schemas = await prisma.schema.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        feature: {
          include: {
            fieldValues: { select: { schemaFieldId: true, value: true } },
          },
        },
        fields: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, name: true, valueType: true, defaultValue: true, createdAt: true },
        },
      },
    })

    return schemas
      .filter((s) => s.feature !== null)
      .map((s) => {
        const overrideMap = new Map(
          s.feature!.fieldValues.map((fv) => [fv.schemaFieldId, fv.value]),
        )

        const fields = s.fields.map((schemaFld) => {
          const override = overrideMap.get(schemaFld.id)
          const hasOverride =
            overrideMap.has(schemaFld.id) && override !== null && override !== undefined

          return {
            schemaFieldId: schemaFld.id,
            name: schemaFld.name,
            valueType: schemaFld.valueType,
            defaultValue: schemaFld.defaultValue,
            effectiveValue: hasOverride ? override : schemaFld.defaultValue,
            hasOverride,
            createdAt: schemaFld.createdAt,
          }
        })

        return {
          schemaId: s.id,
          schemaName: s.name,
          featureId: s.feature!.id,
          featureName: s.name,
          description: s.description,
          fields,
          createdAt: s.feature!.createdAt,
          updatedAt: s.feature!.updatedAt,
        }
      })
  },

  async getFields(featureName: string): Promise<FeatureDetailDTO> {
    const schema = await prisma.schema.findUnique({
      where: { name: featureName },
      include: { fields: { orderBy: { createdAt: 'asc' } }, feature: true },
    })

    if (!schema || !schema.feature) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.FEATURE_NOT_FOUND, 'NOT_FOUND')
    }

    const fieldIds = schema.fields.map((f) => f.id)

    const refs = await prisma.fieldReference.findMany({
      where: { consumerSchemaFieldId: { in: fieldIds } },
      include: {
        targetField: { select: { id: true, name: true } },
        targetFeature: { include: { schema: { select: { id: true, name: true } } } },
      },
    })

    const refMap = new Map(refs.map((r) => [r.consumerSchemaFieldId, r]))
    const effectiveMap = await resolveEffectiveJsonValues(fieldIds)

    const fields: FeatureFieldDTO[] = schema.fields.map((f) => {
      const ref = refMap.get(f.id)
      return {
        schemaFieldId: f.id,
        name: f.name,
        valueType: f.valueType,
        defaultValue: f.defaultValue,
        createdAt: f.createdAt,
        effectiveValue: effectiveMap.get(f.id),
        reference: ref
          ? {
              id: ref.id,
              targetSchemaName: ref.targetFeature.schema.name,
              targetFieldName: ref.targetField.name,
              targetSchemaFieldId: ref.targetSchemaFieldId,
              targetFeatureId: ref.targetFeatureId,
            }
          : null,
      }
    })

    return {
      schemaId: schema.id,
      schemaName: schema.name,
      featureId: schema.feature.id,
      featureName: schema.name,
      fields,
    }
  },

  async updateFieldValue(
    session: SessionUser,
    featureName: string,
    fieldId: string,
    input: PatchFieldValueInput,
  ): Promise<{ cleared: true; deletedCount: number } | { featureFieldValue: { id: string; value: unknown; updatedAt: Date } }> {
    const bundle = await prisma.schema.findUnique({
      where: { name: featureName },
      include: { feature: true, fields: { where: { id: fieldId } } },
    })

    if (!bundle?.feature || bundle.fields.length === 0) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.FIELD_NOT_IN_FEATURE, 'NOT_FOUND')
    }

    const ref = await prisma.fieldReference.findUnique({ where: { consumerSchemaFieldId: fieldId } })
    if (ref) {
      throw new HttpError(HttpStatus.BAD_REQUEST, ERROR_MSG.REFERENCE_ACTIVE, 'REFERENCE_ACTIVE')
    }

    const nextValue = input.value

    if (nextValue === null) {
      const deleted = await prisma.featureFieldValue.deleteMany({
        where: { schemaFieldId: fieldId, featureId: bundle.feature.id },
      })
      await writeAudit({
        actorUserId: session.id,
        actorEmail: session.email,
        entityType: AuditEntity.FEATURE_FIELD_VALUE,
        entityId: fieldId,
        action: AuditAction.UPDATE,
        payload: { featureName, schemaFieldId: fieldId, cleared: true },
      })
      return { cleared: true, deletedCount: deleted.count }
    }

    const jsonValue = nextValue as Prisma.InputJsonValue

    const fv = await prisma.featureFieldValue.upsert({
      where: { schemaFieldId: fieldId },
      create: { featureId: bundle.feature.id, schemaFieldId: fieldId, value: jsonValue },
      update: { value: jsonValue },
      select: { id: true, value: true, updatedAt: true },
    })

    await writeAudit({
      actorUserId: session.id,
      actorEmail: session.email,
      entityType: AuditEntity.FEATURE_FIELD_VALUE,
      entityId: fv.id,
      action: AuditAction.UPDATE,
      payload: { featureName, schemaFieldId: fieldId },
    })

    return { featureFieldValue: fv }
  },

  async getPublicFeature(featureName: string): Promise<PublicFeatureDTO> {
    const schema = await prisma.schema.findUnique({
      where: { name: featureName },
      include: { fields: { orderBy: { createdAt: 'asc' } }, feature: true },
    })

    if (!schema || !schema.feature) {
      throw new HttpError(HttpStatus.NOT_FOUND, ERROR_MSG.FEATURE_NOT_FOUND, 'NOT_FOUND')
    }

    const fieldIds = schema.fields.map((f) => f.id)
    const effectiveMap = await resolveEffectiveJsonValues(fieldIds)

    const fields: Record<string, unknown> = {}
    for (const f of schema.fields) {
      fields[f.name] = effectiveMap.get(f.id) ?? f.defaultValue
    }

    return { feature: schema.name, schemaId: schema.id, fields }
  },
} as const
