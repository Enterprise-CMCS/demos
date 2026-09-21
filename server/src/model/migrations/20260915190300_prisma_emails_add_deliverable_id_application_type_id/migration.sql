SET search_path TO demos_app;

-- DropForeignKey
ALTER TABLE "email_notification" DROP CONSTRAINT "email_notification_application_id_fkey";

-- AlterTable
ALTER TABLE "email_notification" ADD COLUMN     "application_type_id" TEXT,
ADD COLUMN     "deliverable_id" UUID;

-- AlterTable
ALTER TABLE "email_notification_history" ADD COLUMN     "application_type_id" TEXT,
ADD COLUMN     "deliverable_id" UUID;

-- AddForeignKey
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_application_id_application_type_id_fkey" FOREIGN KEY ("application_id", "application_type_id") REFERENCES "application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification" ADD CONSTRAINT "email_notification_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "deliverable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

