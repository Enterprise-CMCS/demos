/*
  Warnings:

  - You are about to drop the column `bundle_type_id` on the `demonstration` table. All the data in the column will be lost.
  - You are about to drop the column `bundle_type_id` on the `demonstration_history` table. All the data in the column will be lost.
  - You are about to drop the column `bundle_id` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `bundle_id` on the `document_history` table. All the data in the column will be lost.
  - You are about to drop the column `bundle_id` on the `document_pending_upload` table. All the data in the column will be lost.
  - You are about to drop the column `bundle_id` on the `document_pending_upload_history` table. All the data in the column will be lost.
  - You are about to drop the column `bundle_id` on the `event` table. All the data in the column will be lost.
  - You are about to drop the column `bundle_type_id` on the `modification` table. All the data in the column will be lost.
  - You are about to drop the column `bundle_type_id` on the `modification_history` table. All the data in the column will be lost.
  - You are about to drop the `bundle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bundle_date` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bundle_date_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bundle_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bundle_phase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bundle_phase_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bundle_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bundle_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `demonstration_bundle_type_limit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modification_bundle_type_limit` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id,application_type_id]` on the table `demonstration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,application_type_id]` on the table `modification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `application_type_id` to the `demonstration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `application_type_id` to the `demonstration_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `application_id` to the `document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `application_id` to the `document_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `application_id` to the `document_pending_upload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `application_id` to the `document_pending_upload_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `application_type_id` to the `modification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `application_type_id` to the `modification_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "demos_app"."bundle" DROP CONSTRAINT "bundle_bundle_type_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."bundle_date" DROP CONSTRAINT "bundle_date_bundle_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."bundle_date" DROP CONSTRAINT "bundle_date_date_type_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."bundle_phase" DROP CONSTRAINT "bundle_phase_bundle_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."bundle_phase" DROP CONSTRAINT "bundle_phase_phase_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."bundle_phase" DROP CONSTRAINT "bundle_phase_phase_status_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."demonstration" DROP CONSTRAINT "demonstration_bundle_type_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."demonstration" DROP CONSTRAINT "demonstration_id_bundle_type_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."demonstration" DROP CONSTRAINT "demonstration_status_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."demonstration_bundle_type_limit" DROP CONSTRAINT "demonstration_bundle_type_limit_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."document" DROP CONSTRAINT "document_bundle_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."document_pending_upload" DROP CONSTRAINT "document_pending_upload_bundle_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."modification" DROP CONSTRAINT "modification_bundle_type_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."modification" DROP CONSTRAINT "modification_id_bundle_type_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."modification" DROP CONSTRAINT "modification_status_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."modification_bundle_type_limit" DROP CONSTRAINT "modification_bundle_type_limit_id_fkey";

-- DropIndex
DROP INDEX "demos_app"."demonstration_id_bundle_type_id_key";

-- DropIndex
DROP INDEX "demos_app"."modification_id_bundle_type_id_key";

-- AlterTable
ALTER TABLE "demos_app"."demonstration" DROP COLUMN "bundle_type_id",
ADD COLUMN     "application_type_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."demonstration_history" DROP COLUMN "bundle_type_id",
ADD COLUMN     "application_type_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document" DROP COLUMN "bundle_id",
ADD COLUMN     "application_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document_history" DROP COLUMN "bundle_id",
ADD COLUMN     "application_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document_pending_upload" DROP COLUMN "bundle_id",
ADD COLUMN     "application_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document_pending_upload_history" DROP COLUMN "bundle_id",
ADD COLUMN     "application_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."event" DROP COLUMN "bundle_id",
ADD COLUMN     "application_id" UUID;

-- AlterTable
ALTER TABLE "demos_app"."modification" DROP COLUMN "bundle_type_id",
ADD COLUMN     "application_type_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."modification_history" DROP COLUMN "bundle_type_id",
ADD COLUMN     "application_type_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "demos_app"."bundle";

-- DropTable
DROP TABLE "demos_app"."bundle_date";

-- DropTable
DROP TABLE "demos_app"."bundle_date_history";

-- DropTable
DROP TABLE "demos_app"."bundle_history";

-- DropTable
DROP TABLE "demos_app"."bundle_phase";

-- DropTable
DROP TABLE "demos_app"."bundle_phase_history";

-- DropTable
DROP TABLE "demos_app"."bundle_status";

-- DropTable
DROP TABLE "demos_app"."bundle_type";

-- DropTable
DROP TABLE "demos_app"."demonstration_bundle_type_limit";

-- DropTable
DROP TABLE "demos_app"."modification_bundle_type_limit";

-- CreateTable
CREATE TABLE "demos_app"."application" (
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,

    CONSTRAINT "application_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_date" (
    "application_id" UUID NOT NULL,
    "date_type_id" TEXT NOT NULL,
    "date_value" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_date_pkey" PRIMARY KEY ("application_id","date_type_id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_date_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID NOT NULL,
    "date_type_id" TEXT NOT NULL,
    "date_value" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_date_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_phase" (
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "phase_status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_phase_pkey" PRIMARY KEY ("application_id","phase_id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_phase_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "phase_status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_phase_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."demonstration_application_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "demonstration_application_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."modification_application_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "modification_application_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_id_application_type_id_key" ON "demos_app"."application"("id", "application_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "demonstration_id_application_type_id_key" ON "demos_app"."demonstration"("id", "application_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "modification_id_application_type_id_key" ON "demos_app"."modification"("id", "application_type_id");

-- AddForeignKey
ALTER TABLE "demos_app"."application" ADD CONSTRAINT "application_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "demos_app"."application_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."application_date" ADD CONSTRAINT "application_date_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "demos_app"."application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."application_date" ADD CONSTRAINT "application_date_date_type_id_fkey" FOREIGN KEY ("date_type_id") REFERENCES "demos_app"."date_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."application_phase" ADD CONSTRAINT "application_phase_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "demos_app"."application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."application_phase" ADD CONSTRAINT "application_phase_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "demos_app"."phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."application_phase" ADD CONSTRAINT "application_phase_phase_status_id_fkey" FOREIGN KEY ("phase_status_id") REFERENCES "demos_app"."phase_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "demos_app"."application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "demos_app"."demonstration_application_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "demos_app"."application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration_application_type_limit" ADD CONSTRAINT "demonstration_application_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "demos_app"."application_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."document" ADD CONSTRAINT "document_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "demos_app"."application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."document_pending_upload" ADD CONSTRAINT "document_pending_upload_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "demos_app"."application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."modification" ADD CONSTRAINT "modification_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "demos_app"."application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."modification" ADD CONSTRAINT "modification_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "demos_app"."modification_application_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."modification" ADD CONSTRAINT "modification_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "demos_app"."application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."modification_application_type_limit" ADD CONSTRAINT "modification_application_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "demos_app"."application_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
