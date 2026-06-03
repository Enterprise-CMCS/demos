/*
  Warnings:

  - Added the required column `owner_person_type_id` to the `reference` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_person_type_id` to the `reference_agreement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_person_type_id` to the `reference_agreement_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_person_type_id` to the `reference_history` table without a default value. This is not possible if the table is not empty.

*/
SET search_path TO demos_app;

-- DropForeignKey
ALTER TABLE "reference" DROP CONSTRAINT "reference_owner_user_id_fkey";

-- DropForeignKey
ALTER TABLE "reference_agreement" DROP CONSTRAINT "reference_agreement_owner_user_id_fkey";

-- AlterTable
ALTER TABLE "reference" ADD COLUMN     "owner_person_type_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reference_agreement" ADD COLUMN     "owner_person_type_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reference_agreement_history" ADD COLUMN     "owner_person_type_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reference_history" ADD COLUMN     "owner_person_type_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "reference" ADD CONSTRAINT "reference_owner_user_id_owner_person_type_id_fkey" FOREIGN KEY ("owner_user_id", "owner_person_type_id") REFERENCES "users"("id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference" ADD CONSTRAINT "reference_owner_person_type_id_fkey" FOREIGN KEY ("owner_person_type_id") REFERENCES "cms_user_person_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_agreement" ADD CONSTRAINT "reference_agreement_owner_user_id_owner_person_type_id_fkey" FOREIGN KEY ("owner_user_id", "owner_person_type_id") REFERENCES "users"("id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_agreement" ADD CONSTRAINT "reference_agreement_owner_person_type_id_fkey" FOREIGN KEY ("owner_person_type_id") REFERENCES "cms_user_person_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
