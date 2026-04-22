/*
  Warnings:

  - A unique constraint covering the columns `[id,due_date_change_allowed,should_have_note,should_have_user_id,extension_id_optional]` on the table `deliverable_action_type` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `extension_id_optional` to the `deliverable_action` table without a default value. This is not possible if the table is not empty.
  - Added the required column `extension_id_optional` to the `deliverable_action_type` table without a default value. This is not possible if the table is not empty.

*/

SET search_path TO demos_app;

-- DropForeignKey
ALTER TABLE "deliverable_action" DROP CONSTRAINT "deliverable_action_action_type_id_due_date_change_allowed__fkey";

-- DropIndex
DROP INDEX "deliverable_action_type_id_due_date_change_allowed_should_h_key";

-- AlterTable
ALTER TABLE "deliverable_action" ADD COLUMN     "extension_id_optional" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "deliverable_action" ALTER COLUMN     "extension_id_optional" DROP DEFAULT;

-- AlterTable
ALTER TABLE "deliverable_action_type" ADD COLUMN     "extension_id_optional" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "deliverable_action_type" ALTER COLUMN     "extension_id_optional" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_action_type_id_due_date_change_allowed_should_h_key" ON "deliverable_action_type"("id", "due_date_change_allowed", "should_have_note", "should_have_user_id", "extension_id_optional");

-- AddForeignKey
ALTER TABLE "deliverable_action" ADD CONSTRAINT "deliverable_action_action_type_id_due_date_change_allowed__fkey" FOREIGN KEY ("action_type_id", "due_date_change_allowed", "should_have_note", "should_have_user_id", "extension_id_optional") REFERENCES "deliverable_action_type"("id", "due_date_change_allowed", "should_have_note", "should_have_user_id", "extension_id_optional") ON DELETE RESTRICT ON UPDATE CASCADE;
