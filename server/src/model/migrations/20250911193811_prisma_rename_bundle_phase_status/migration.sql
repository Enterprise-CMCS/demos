/*
  Warnings:

  - You are about to drop the `bundle_phase_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bundle_phase_status_history` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "demos_app"."bundle_phase_status" DROP CONSTRAINT "bundle_phase_status_bundle_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."bundle_phase_status" DROP CONSTRAINT "bundle_phase_status_phase_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."bundle_phase_status" DROP CONSTRAINT "bundle_phase_status_phase_status_id_fkey";

-- DropTable
DROP TABLE "demos_app"."bundle_phase_status";

-- DropTable
DROP TABLE "demos_app"."bundle_phase_status_history";

-- CreateTable
CREATE TABLE "demos_app"."bundle_phase" (
    "bundle_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "phase_status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bundle_phase_pkey" PRIMARY KEY ("bundle_id","phase_id")
);

-- CreateTable
CREATE TABLE "demos_app"."bundle_phase_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bundle_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "phase_status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bundle_phase_history_pkey" PRIMARY KEY ("revision_id")
);

-- AddForeignKey
ALTER TABLE "demos_app"."bundle_phase" ADD CONSTRAINT "bundle_phase_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "demos_app"."bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."bundle_phase" ADD CONSTRAINT "bundle_phase_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "demos_app"."phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."bundle_phase" ADD CONSTRAINT "bundle_phase_phase_status_id_fkey" FOREIGN KEY ("phase_status_id") REFERENCES "demos_app"."phase_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
