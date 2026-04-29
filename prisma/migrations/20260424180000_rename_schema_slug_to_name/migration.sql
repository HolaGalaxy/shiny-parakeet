-- RenameColumn
ALTER TABLE "Schema" RENAME COLUMN "slug" TO "name";

-- RenameIndex
ALTER INDEX "Schema_slug_key" RENAME TO "Schema_name_key";
