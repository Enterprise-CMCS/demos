/*
  Warnings:

  - You are about to drop the `bundle_phase_date` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bundle_phase_date_history` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id,bundle_type_id]` on the table `modification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "modification_id_bundle_type_id_key" ON "demos_app"."modification"("id", "bundle_type_id");

-- DropForeignKey
ALTER TABLE "demos_app"."bundle_phase_date" DROP CONSTRAINT "bundle_phase_date_bundle_id_phase_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."bundle_phase_date" DROP CONSTRAINT "bundle_phase_date_date_type_id_fkey";

-- DropTable
DROP TABLE "demos_app"."bundle_phase_date";

-- DropTable
DROP TABLE "demos_app"."bundle_phase_date_history";

-- CreateTable
CREATE TABLE "demos_app"."bundle_date" (
    "bundle_id" UUID NOT NULL,
    "date_type_id" TEXT NOT NULL,
    "date_value" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bundle_date_pkey" PRIMARY KEY ("bundle_id","date_type_id")
);

-- CreateTable
CREATE TABLE "demos_app"."bundle_date_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bundle_id" UUID NOT NULL,
    "date_type_id" TEXT NOT NULL,
    "date_value" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bundle_date_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."phase_date_type" (
    "phase_id" TEXT NOT NULL,
    "date_type_id" TEXT NOT NULL,

    CONSTRAINT "phase_date_type_pkey" PRIMARY KEY ("phase_id","date_type_id")
);

-- AddForeignKey
ALTER TABLE "demos_app"."bundle_date" ADD CONSTRAINT "bundle_date_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "demos_app"."bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."bundle_date" ADD CONSTRAINT "bundle_date_date_type_id_fkey" FOREIGN KEY ("date_type_id") REFERENCES "demos_app"."date_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."phase_date_type" ADD CONSTRAINT "phase_date_type_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "demos_app"."phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."phase_date_type" ADD CONSTRAINT "phase_date_type_date_type_id_fkey" FOREIGN KEY ("date_type_id") REFERENCES "demos_app"."date_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
