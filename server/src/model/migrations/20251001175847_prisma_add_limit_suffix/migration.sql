/*
  Warnings:

  - You are about to drop the `demonstration_bundle_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modification_bundle_type` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "demos_app"."demonstration" DROP CONSTRAINT "demonstration_bundle_type_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."demonstration_bundle_type" DROP CONSTRAINT "demonstration_bundle_type_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."modification" DROP CONSTRAINT "modification_bundle_type_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."modification_bundle_type" DROP CONSTRAINT "modification_bundle_type_id_fkey";

-- DropTable
DROP TABLE "demos_app"."demonstration_bundle_type";

-- DropTable
DROP TABLE "demos_app"."modification_bundle_type";

-- CreateTable
CREATE TABLE "demos_app"."demonstration_bundle_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "demonstration_bundle_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."modification_bundle_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "modification_bundle_type_limit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_bundle_type_id_fkey" FOREIGN KEY ("bundle_type_id") REFERENCES "demos_app"."demonstration_bundle_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration_bundle_type_limit" ADD CONSTRAINT "demonstration_bundle_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "demos_app"."bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."modification" ADD CONSTRAINT "modification_bundle_type_id_fkey" FOREIGN KEY ("bundle_type_id") REFERENCES "demos_app"."modification_bundle_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."modification_bundle_type_limit" ADD CONSTRAINT "modification_bundle_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "demos_app"."bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
