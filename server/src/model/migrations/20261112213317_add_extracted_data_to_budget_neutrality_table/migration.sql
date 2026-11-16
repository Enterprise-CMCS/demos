-- DropForeignKey
ALTER TABLE "amendment" DROP CONSTRAINT "amendment_id_application_type_id_fkey";

-- DropForeignKey
ALTER TABLE "application_tag_suggestion_extract" DROP CONSTRAINT "application_tag_suggestion_extract_application_id_value_fkey";

-- DropForeignKey
ALTER TABLE "budget_neutrality_workbook" DROP CONSTRAINT "budget_neutrality_workbook_id_document_type_id_fkey";

-- DropForeignKey
ALTER TABLE "deliverable_active_extension" DROP CONSTRAINT "deliverable_active_extension_deliverable_extension_id_deli_fkey";

-- DropForeignKey
ALTER TABLE "demonstration" DROP CONSTRAINT "demonstration_id_application_type_id_fkey";

-- DropForeignKey
ALTER TABLE "extension" DROP CONSTRAINT "extension_id_application_type_id_fkey";

-- AlterTable
ALTER TABLE "budget_neutrality_workbook" ADD COLUMN     "extracted_data" JSONB;

-- AlterTable
ALTER TABLE "budget_neutrality_workbook_history" ADD COLUMN     "extracted_data" JSONB;

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_suggestion_extract" ADD CONSTRAINT "application_tag_suggestion_extract_application_id_value_fkey" FOREIGN KEY ("application_id", "value") REFERENCES "application_tag_suggestion"("application_id", "value") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_neutrality_workbook" ADD CONSTRAINT "budget_neutrality_workbook_id_document_type_id_fkey" FOREIGN KEY ("id", "document_type_id") REFERENCES "document"("id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_active_extension" ADD CONSTRAINT "deliverable_active_extension_deliverable_extension_id_deli_fkey" FOREIGN KEY ("deliverable_extension_id", "deliverable_id", "status_id") REFERENCES "deliverable_extension"("id", "deliverable_id", "status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
