/*
  Warnings:

  - A unique constraint covering the columns `[id,application_id]` on the table `document` will be added. If there are existing duplicate values, this will fail.

*/

SET search_path TO demos_app;

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "deliverable_id" UUID,
ADD COLUMN     "deliverable_is_cms_attached_file" BOOLEAN,
ADD COLUMN     "deliverable_submission_action_id" UUID,
ADD COLUMN     "deliverable_submission_action_type_id" TEXT,
ADD COLUMN     "deliverable_type_id" TEXT,
ALTER COLUMN "phase_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "document_history" ADD COLUMN     "deliverable_id" UUID,
ADD COLUMN     "deliverable_is_cms_attached_file" BOOLEAN,
ADD COLUMN     "deliverable_submission_action_id" UUID,
ADD COLUMN     "deliverable_submission_action_type_id" TEXT,
ADD COLUMN     "deliverable_type_id" TEXT,
ALTER COLUMN "phase_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "document_infected" ADD COLUMN     "deliverable_id" UUID,
ADD COLUMN     "deliverable_is_cms_attached_file" BOOLEAN,
ADD COLUMN     "deliverable_type_id" TEXT,
ALTER COLUMN "phase_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "document_infected_history" ADD COLUMN     "deliverable_id" UUID,
ADD COLUMN     "deliverable_is_cms_attached_file" BOOLEAN,
ADD COLUMN     "deliverable_type_id" TEXT,
ALTER COLUMN "phase_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "document_pending_upload" ADD COLUMN     "deliverable_id" UUID,
ADD COLUMN     "deliverable_is_cms_attached_file" BOOLEAN,
ADD COLUMN     "deliverable_type_id" TEXT,
ALTER COLUMN "phase_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "document_pending_upload_history" ADD COLUMN     "deliverable_id" UUID,
ADD COLUMN     "deliverable_is_cms_attached_file" BOOLEAN,
ADD COLUMN     "deliverable_type_id" TEXT,
ALTER COLUMN "phase_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "deliverable_submission_action_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "deliverable_submission_action_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_type_document_type" (
    "deliverable_type_id" TEXT NOT NULL,
    "document_type_id" TEXT NOT NULL,

    CONSTRAINT "deliverable_type_document_type_pkey" PRIMARY KEY ("deliverable_type_id","document_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_id_application_id_key" ON "document"("id", "application_id");

-- AddForeignKey
ALTER TABLE "deliverable_submission_action_type_limit" ADD CONSTRAINT "deliverable_submission_action_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "deliverable_action_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_type_document_type" ADD CONSTRAINT "deliverable_type_document_type_deliverable_type_id_fkey" FOREIGN KEY ("deliverable_type_id") REFERENCES "deliverable_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_type_document_type" ADD CONSTRAINT "deliverable_type_document_type_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_deliverable_id_application_id_deliverable_type_id_fkey" FOREIGN KEY ("deliverable_id", "application_id", "deliverable_type_id") REFERENCES "deliverable"("id", "demonstration_id", "deliverable_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_deliverable_type_id_document_type_id_fkey" FOREIGN KEY ("deliverable_type_id", "document_type_id") REFERENCES "deliverable_type_document_type"("deliverable_type_id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_deliverable_submission_action_id_deliverable_subm_fkey" FOREIGN KEY ("deliverable_submission_action_id", "deliverable_submission_action_type_id") REFERENCES "deliverable_action"("id", "action_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_deliverable_submission_action_type_id_fkey" FOREIGN KEY ("deliverable_submission_action_type_id") REFERENCES "deliverable_submission_action_type_limit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_infected" ADD CONSTRAINT "document_infected_deliverable_id_application_id_deliverabl_fkey" FOREIGN KEY ("deliverable_id", "application_id", "deliverable_type_id") REFERENCES "deliverable"("id", "demonstration_id", "deliverable_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_infected" ADD CONSTRAINT "document_infected_deliverable_type_id_document_type_id_fkey" FOREIGN KEY ("deliverable_type_id", "document_type_id") REFERENCES "deliverable_type_document_type"("deliverable_type_id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_pending_upload" ADD CONSTRAINT "document_pending_upload_deliverable_id_application_id_deli_fkey" FOREIGN KEY ("deliverable_id", "application_id", "deliverable_type_id") REFERENCES "deliverable"("id", "demonstration_id", "deliverable_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_pending_upload" ADD CONSTRAINT "document_pending_upload_deliverable_type_id_document_type__fkey" FOREIGN KEY ("deliverable_type_id", "document_type_id") REFERENCES "deliverable_type_document_type"("deliverable_type_id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
