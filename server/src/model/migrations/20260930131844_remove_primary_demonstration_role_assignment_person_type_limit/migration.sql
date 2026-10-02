/*
  Warnings:

  - You are about to drop the column `person_type_id` on the `primary_demonstration_role_assignment` table. All the data in the column will be lost.
  - You are about to drop the column `person_type_id` on the `primary_demonstration_role_assignment_history` table. All the data in the column will be lost.
  - You are about to drop the `primary_demonstration_role_assignment_person_type_limit` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[person_id,demonstration_id,role_id]` on the table `primary_demonstration_role_assignment` will be added. If there are existing duplicate values, this will fail.
*/

SET search_path TO demos_app;

-- DropForeignKey
ALTER TABLE "primary_demonstration_role_assignment" DROP CONSTRAINT "primary_demonstration_role_assignment_person_id_demonstrat_fkey";

-- DropForeignKey
ALTER TABLE "primary_demonstration_role_assignment" DROP CONSTRAINT "primary_demonstration_role_assignment_person_type_id_fkey";

-- DropForeignKey
ALTER TABLE "primary_demonstration_role_assignment_person_type_limit" DROP CONSTRAINT "primary_demonstration_role_assignment_person_type_limit_id_fkey";

-- DropIndex
DROP INDEX "demonstration_role_assignment_person_id_demonstration_id_ro_key";

-- DropIndex
DROP INDEX "primary_demonstration_role_assignment_person_id_demonstrati_key";

-- AlterTable
ALTER TABLE "primary_demonstration_role_assignment" DROP COLUMN "person_type_id";

-- AlterTable
ALTER TABLE "primary_demonstration_role_assignment_history" DROP COLUMN "person_type_id";

-- DropTable
DROP TABLE "primary_demonstration_role_assignment_person_type_limit";

-- CreateIndex
CREATE UNIQUE INDEX "primary_demonstration_role_assignment_person_id_demonstrati_key" ON "primary_demonstration_role_assignment"("person_id", "demonstration_id", "role_id");

-- AddForeignKey
ALTER TABLE "primary_demonstration_role_assignment" ADD CONSTRAINT "primary_demonstration_role_assignment_person_id_demonstrat_fkey" FOREIGN KEY ("person_id", "demonstration_id", "role_id") REFERENCES "demonstration_role_assignment"("person_id", "demonstration_id", "role_id") ON DELETE RESTRICT ON UPDATE CASCADE;
