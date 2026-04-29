-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'READ_WRITE', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('SCHEMA_FIELD_ADD', 'SCHEMA_FIELD_UPDATE', 'SCHEMA_FIELD_DELETE', 'FEATURE_VALUE_UPDATE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TICKET_CREATED', 'TICKET_APPROVED', 'TICKET_REJECTED', 'USER_INVITED', 'USER_ACTIVATED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "inviteExpiresAt" TIMESTAMPTZ,
ADD COLUMN     "inviteToken" VARCHAR(128),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profilePicture" VARCHAR(512),
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'READ_ONLY',
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing users as active super admins
UPDATE "User" SET "isActive" = true, "role" = 'SUPER_ADMIN' WHERE "isActive" = false;

-- CreateTable
CREATE TABLE "Ticket" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "TicketType" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "schemaId" UUID NOT NULL,
    "schemaFieldId" UUID,
    "featureId" UUID,
    "oldValue" JSONB,
    "newValue" JSONB NOT NULL,
    "reviewComment" VARCHAR(1024),
    "createdById" UUID NOT NULL,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "message" VARCHAR(1024) NOT NULL,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ticket_schemaId_status_idx" ON "Ticket"("schemaId", "status");

-- CreateIndex
CREATE INDEX "Ticket_createdById_idx" ON "Ticket"("createdById");

-- CreateIndex
CREATE INDEX "Ticket_status_createdAt_idx" ON "Ticket"("status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_one_pending_per_field" ON "Ticket"("schemaFieldId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteToken_key" ON "User"("inviteToken");

-- CreateIndex
CREATE INDEX "User_inviteToken_idx" ON "User"("inviteToken");

-- CreateIndex
CREATE INDEX "User_isDeleted_role_idx" ON "User"("isDeleted", "role");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
