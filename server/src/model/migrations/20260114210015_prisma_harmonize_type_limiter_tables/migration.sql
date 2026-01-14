/*
  Warnings:

  - You are about to drop the `demonstration_grant_level_limit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_grant_level_limit` table. If the table is not empty, all the data it contains will be lost.

*/

-- DropForeignKey
ALTER TABLE "demonstration_grant_level_limit" DROP CONSTRAINT "demonstration_grant_level_limit_id_fkey";

-- DropForeignKey
ALTER TABLE "demonstration_role_assignment" DROP CONSTRAINT "demonstration_role_assignment_grant_level_id_fkey";

-- DropForeignKey
ALTER TABLE "system_grant_level_limit" DROP CONSTRAINT "system_grant_level_limit_id_fkey";

-- DropForeignKey
ALTER TABLE "system_role_assignment" DROP CONSTRAINT "system_role_assignment_grant_level_id_fkey";

-- DropTable
DROP TABLE "demonstration_grant_level_limit";

-- DropTable
DROP TABLE "system_grant_level_limit";

-- CreateTable
CREATE TABLE "demonstration_grant_level_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "demonstration_grant_level_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_grant_level_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "system_grant_level_type_limit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "demonstration_grant_level_type_limit" ADD CONSTRAINT "demonstration_grant_level_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "grant_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_grant_level_id_fkey" FOREIGN KEY ("grant_level_id") REFERENCES "demonstration_grant_level_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_grant_level_type_limit" ADD CONSTRAINT "system_grant_level_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "grant_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_role_assignment" ADD CONSTRAINT "system_role_assignment_grant_level_id_fkey" FOREIGN KEY ("grant_level_id") REFERENCES "system_grant_level_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
