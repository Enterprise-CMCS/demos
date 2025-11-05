-- AlterTable
ALTER TABLE "demos_app"."document" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document_history" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document_pending_upload" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document_pending_upload_history" ALTER COLUMN "description" DROP NOT NULL;
