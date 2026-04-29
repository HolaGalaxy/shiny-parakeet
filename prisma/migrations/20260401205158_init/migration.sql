-- CreateEnum
CREATE TYPE "FieldValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'ARRAY', 'OBJECT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(256),
    "email" VARCHAR(320) NOT NULL,
    "username" VARCHAR(128) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schema" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(128) NOT NULL,
    "description" VARCHAR(320) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Schema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schemaId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemaField" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schemaId" UUID NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "valueType" "FieldValueType" NOT NULL,
    "defaultValue" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemaField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFieldValue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "featureId" UUID NOT NULL,
    "schemaFieldId" UUID NOT NULL,
    "value" JSONB,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "FeatureFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldReference" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "consumerFeatureId" UUID NOT NULL,
    "consumerSchemaFieldId" UUID NOT NULL,
    "targetFeatureId" UUID NOT NULL,
    "targetSchemaFieldId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorEmail" VARCHAR(320) NOT NULL,
    "actorUserId" UUID,
    "entityType" VARCHAR(64) NOT NULL,
    "entityId" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Schema_slug_key" ON "Schema"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_schemaId_key" ON "Feature"("schemaId");

-- CreateIndex
CREATE INDEX "SchemaField_schemaId_createdAt_id_idx" ON "SchemaField"("schemaId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SchemaField_schemaId_name_key" ON "SchemaField"("schemaId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFieldValue_schemaFieldId_key" ON "FeatureFieldValue"("schemaFieldId");

-- CreateIndex
CREATE INDEX "FeatureFieldValue_featureId_idx" ON "FeatureFieldValue"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldReference_consumerSchemaFieldId_key" ON "FieldReference"("consumerSchemaFieldId");

-- CreateIndex
CREATE INDEX "FieldReference_consumerFeatureId_idx" ON "FieldReference"("consumerFeatureId");

-- CreateIndex
CREATE INDEX "FieldReference_targetFeatureId_targetSchemaFieldId_idx" ON "FieldReference"("targetFeatureId", "targetSchemaFieldId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_actorEmail_createdAt_idx" ON "AuditLog"("actorEmail", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "Schema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemaField" ADD CONSTRAINT "SchemaField_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "Schema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFieldValue" ADD CONSTRAINT "FeatureFieldValue_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFieldValue" ADD CONSTRAINT "FeatureFieldValue_schemaFieldId_fkey" FOREIGN KEY ("schemaFieldId") REFERENCES "SchemaField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldReference" ADD CONSTRAINT "FieldReference_consumerFeatureId_fkey" FOREIGN KEY ("consumerFeatureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldReference" ADD CONSTRAINT "FieldReference_consumerSchemaFieldId_fkey" FOREIGN KEY ("consumerSchemaFieldId") REFERENCES "SchemaField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldReference" ADD CONSTRAINT "FieldReference_targetFeatureId_fkey" FOREIGN KEY ("targetFeatureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldReference" ADD CONSTRAINT "FieldReference_targetSchemaFieldId_fkey" FOREIGN KEY ("targetSchemaFieldId") REFERENCES "SchemaField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
