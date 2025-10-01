/*
  Warnings:

  - You are about to drop the column `cmcs_division_id` on the `demonstration` table. All the data in the column will be lost.
  - You are about to drop the column `cmcs_division_id` on the `demonstration_history` table. All the data in the column will be lost.
  - You are about to drop the `cmcs_division` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "demos_app"."demonstration" DROP CONSTRAINT "demonstration_cmcs_division_id_fkey";

-- AlterTable
ALTER TABLE "demos_app"."demonstration" DROP COLUMN "cmcs_division_id",
ADD COLUMN     "sdg_division_id" TEXT;

-- AlterTable
ALTER TABLE "demos_app"."demonstration_history" DROP COLUMN "cmcs_division_id",
ADD COLUMN     "sdg_division_id" TEXT;

-- DropTable
DROP TABLE "demos_app"."cmcs_division";

-- CreateTable
CREATE TABLE "demos_app"."sdg_division" (
    "id" TEXT NOT NULL,

    CONSTRAINT "sdg_division_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_sdg_division_id_fkey" FOREIGN KEY ("sdg_division_id") REFERENCES "demos_app"."sdg_division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
