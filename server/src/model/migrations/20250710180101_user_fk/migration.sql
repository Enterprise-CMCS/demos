/*
  Warnings:

  - You are about to drop the column `project_officer_user_id` on the `demonstration_history` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "demonstration" DROP CONSTRAINT "demonstration_project_officer_user_id_fkey";

-- DropForeignKey
ALTER TABLE "demonstration_history" DROP CONSTRAINT "demonstration_history_project_officer_id_fkey";

-- AlterTable
ALTER TABLE "demonstration_history" DROP COLUMN "project_officer_user_id";

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_project_officer_user_id_fkey" FOREIGN KEY ("project_officer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
