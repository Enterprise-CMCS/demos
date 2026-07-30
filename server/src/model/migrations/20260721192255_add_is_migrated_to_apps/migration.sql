SET search_path TO demos_app;

-- AlterTable
ALTER TABLE "application" ADD COLUMN     "is_migrated_from_pmda" BOOLEAN NOT NULL DEFAULT false;
