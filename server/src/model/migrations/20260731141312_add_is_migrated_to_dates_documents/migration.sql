SET search_path TO demos_app;

-- AlterTable
ALTER TABLE "application_date" ADD COLUMN     "is_migrated_from_pmda" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "is_migrated_from_pmda" BOOLEAN NOT NULL DEFAULT false;
