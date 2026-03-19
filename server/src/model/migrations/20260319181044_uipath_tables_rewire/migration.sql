-- DropForeignKey
ALTER TABLE "amendment" DROP CONSTRAINT "amendment_id_application_type_id_fkey";

-- DropForeignKey
ALTER TABLE "demonstration" DROP CONSTRAINT "demonstration_id_application_type_id_fkey";

-- DropForeignKey
ALTER TABLE "extension" DROP CONSTRAINT "extension_id_application_type_id_fkey";

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
