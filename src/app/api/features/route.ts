import { requireSession } from "@/lib/auth/require-session";
import { prisma } from "@/lib/db/prisma";
import { jsonError, jsonOk } from "@/lib/http/http-error";

export async function GET() {
    try {
        await requireSession();

        const schemas = await prisma.schema.findMany({
            orderBy: { createdAt: "asc" },
            include: {
                feature: {
                    include: {
                        fieldValues: { select: { schemaFieldId: true, value: true,  } },
                    },
                },
                fields: {
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        name: true,
                        valueType: true,
                        defaultValue: true,
                        createdAt: true,
                    },
                },
            },
        });

        const features = schemas
            .filter((s) => s.feature !== null)
            .map((s) => {
                const overrideMap = new Map(
                    s.feature!.fieldValues.map((fv) => [fv.schemaFieldId, fv.value])
                )

                const fields = s.fields.map((schemaFld) => {
                    const override = overrideMap.get(schemaFld.id)
                    const hasOverride = overrideMap.has(schemaFld.id) && override !== null && override !== undefined

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

        return jsonOk({ features });
    } catch (e: unknown) {
        return jsonError(e);
    }
}