SET search_path TO demos_app;

/*
  Warnings:

  - The primary key for the `application_tag_suggestion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `application_tag_suggestion` table. All the data in the column will be lost.
  - The primary key for the `application_tag_suggestion_extract` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `suggestion_id` on the `application_tag_suggestion_extract` table. All the data in the column will be lost.
  - You are about to drop the column `suggestion_id` on the `application_tag_suggestion_extract_history` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `application_tag_suggestion_history` table. All the data in the column will be lost.
*/

-- DropForeignKey
-- Note: this is a deferred check constraint, so it must be dropped to allow changes in its referenced columns.
ALTER TABLE "application_tag_suggestion_extract" DROP CONSTRAINT "application_tag_suggestion_extract_suggestion_id_applicati_fkey";

-- DropIndex
DROP INDEX "application_tag_suggestion_id_application_id_value_key";

-- AlterTable
ALTER TABLE "application_tag_suggestion" DROP CONSTRAINT "application_tag_suggestion_pkey",
DROP COLUMN "id",
ADD COLUMN "replaced_value" TEXT,
ADD CONSTRAINT "application_tag_suggestion_pkey" PRIMARY KEY ("application_id", "value");

-- AlterTable
ALTER TABLE "application_tag_suggestion_extract" DROP CONSTRAINT "application_tag_suggestion_extract_pkey",
DROP COLUMN "suggestion_id",
ADD CONSTRAINT "application_tag_suggestion_extract_pkey" PRIMARY KEY ("uipath_value_id", "application_id", "value");

-- AlterTable
ALTER TABLE "application_tag_suggestion_extract_history" DROP COLUMN "suggestion_id";

-- AlterTable
ALTER TABLE "application_tag_suggestion_history" DROP COLUMN "id",
ADD COLUMN "replaced_value" TEXT;

-- AddForeignKey
-- intentionally left in generation of default FK by prisma to maintain general pattern of drop and recreate in followup migration
ALTER TABLE "application_tag_suggestion_extract" ADD CONSTRAINT "application_tag_suggestion_extract_application_id_value_fkey" FOREIGN KEY ("application_id", "value") REFERENCES "application_tag_suggestion"("application_id", "value") ON DELETE RESTRICT ON UPDATE CASCADE;

