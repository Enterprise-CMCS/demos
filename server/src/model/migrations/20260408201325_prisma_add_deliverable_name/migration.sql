SET search_path TO demos_app;

-- AlterTable
ALTER TABLE "deliverable" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "deliverable_history" ADD COLUMN     "name" TEXT NOT NULL;
