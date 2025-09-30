/*
  Warnings:

  - Added the required column `phase_id` to the `document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phase_id` to the `document_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phase_id` to the `document_pending_upload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phase_id` to the `document_pending_upload_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "demos_app"."document" DROP CONSTRAINT "document_document_type_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."document_pending_upload" DROP CONSTRAINT "document_pending_upload_document_type_id_fkey";

-- AlterTable
ALTER TABLE "demos_app"."document" ADD COLUMN     "phase_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document_history" ADD COLUMN     "phase_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document_pending_upload" ADD COLUMN     "phase_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document_pending_upload_history" ADD COLUMN     "phase_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "demos_app"."phase_document_type" (
    "phase_id" TEXT NOT NULL,
    "document_type_id" TEXT NOT NULL,

    CONSTRAINT "phase_document_type_pkey" PRIMARY KEY ("phase_id","document_type_id")
);

-- AddForeignKey
ALTER TABLE "demos_app"."document" ADD CONSTRAINT "document_phase_id_document_type_id_fkey" FOREIGN KEY ("phase_id", "document_type_id") REFERENCES "demos_app"."phase_document_type"("phase_id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."document_pending_upload" ADD CONSTRAINT "document_pending_upload_phase_id_document_type_id_fkey" FOREIGN KEY ("phase_id", "document_type_id") REFERENCES "demos_app"."phase_document_type"("phase_id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."phase_document_type" ADD CONSTRAINT "phase_document_type_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "demos_app"."phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."phase_document_type" ADD CONSTRAINT "phase_document_type_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "demos_app"."document_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
