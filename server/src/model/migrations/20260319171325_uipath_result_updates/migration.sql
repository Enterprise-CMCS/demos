/*
  Warnings:

  - A unique constraint covering the columns `[id,application_id]` on the table `document` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[document_id]` on the table `uipath_result` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,document_id,application_id]` on the table `uipath_result` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `application_id` to the `uipath_result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `uipath_result` table without a default value. This is not possible if the table is not empty.
  - Made the column `document_id` on table `uipath_result` required. This step will fail if there are existing NULL values in that column.

*/

-- DropForeignKey
ALTER TABLE "uipath_result" DROP CONSTRAINT "uipath_result_document_id_fkey";

-- AlterTable
ALTER TABLE "uipath_result" ADD COLUMN     "application_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
ALTER COLUMN "document_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "document_id_application_id_key" ON "document"("id", "application_id");

-- CreateIndex
CREATE UNIQUE INDEX "uipath_result_document_id_key" ON "uipath_result"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "uipath_result_id_document_id_application_id_key" ON "uipath_result"("id", "document_id", "application_id");

-- RenameForeignKey
ALTER TABLE "application_tag_suggestion_extract" RENAME CONSTRAINT "application_tag_suggestion_extract_suggestion_id_application_id" TO "application_tag_suggestion_extract_suggestion_id_applicati_fkey";

-- RenameForeignKey
ALTER TABLE "application_tag_suggestion_extract" RENAME CONSTRAINT "application_tag_suggestion_extract_uipath_value_id_application_" TO "application_tag_suggestion_extract_uipath_value_id_applica_fkey";

-- AddForeignKey
ALTER TABLE "uipath_result" ADD CONSTRAINT "uipath_result_document_id_application_id_fkey" FOREIGN KEY ("document_id", "application_id") REFERENCES "document"("id", "application_id") ON DELETE RESTRICT ON UPDATE CASCADE;
