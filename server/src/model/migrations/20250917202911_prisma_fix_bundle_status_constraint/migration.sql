/*
  Warnings:

  - You are about to drop the column `demonstration_status_id` on the `demonstration` table. All the data in the column will be lost.
  - You are about to drop the column `demonstration_status_id` on the `demonstration_history` table. All the data in the column will be lost.
  - You are about to drop the column `modification_status_id` on the `modification` table. All the data in the column will be lost.
  - You are about to drop the column `modification_status_id` on the `modification_history` table. All the data in the column will be lost.
  - You are about to drop the `demonstration_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `demonstration_status_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modification_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modification_status_history` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `status_id` to the `demonstration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_id` to the `demonstration_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_id` to the `modification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_id` to the `modification_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "demos_app"."demonstration" DROP CONSTRAINT "demonstration_demonstration_status_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."modification" DROP CONSTRAINT "modification_modification_status_id_bundle_type_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."modification_status" DROP CONSTRAINT "modification_status_bundle_type_id_fkey";

-- AlterTable
ALTER TABLE "demos_app"."demonstration" DROP COLUMN "demonstration_status_id",
ADD COLUMN     "status_id" TEXT NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."demonstration_history" DROP COLUMN "demonstration_status_id",
ADD COLUMN     "status_id" TEXT NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."modification" DROP COLUMN "modification_status_id",
ADD COLUMN     "status_id" TEXT NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."modification_history" DROP COLUMN "modification_status_id",
ADD COLUMN     "status_id" TEXT NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- DropTable
DROP TABLE "demos_app"."demonstration_status";

-- DropTable
DROP TABLE "demos_app"."demonstration_status_history";

-- DropTable
DROP TABLE "demos_app"."modification_status";

-- DropTable
DROP TABLE "demos_app"."modification_status_history";

-- CreateTable
CREATE TABLE "demos_app"."bundle_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "bundle_status_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "demos_app"."bundle_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."modification" ADD CONSTRAINT "modification_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "demos_app"."bundle_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
