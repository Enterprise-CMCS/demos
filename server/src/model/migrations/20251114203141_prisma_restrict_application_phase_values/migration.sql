-- DropForeignKey
ALTER TABLE "demos_app"."application_phase" DROP CONSTRAINT "application_phase_phase_id_fkey";

-- CreateTable
CREATE TABLE "demos_app"."application_phase_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_phase_type_limit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "demos_app"."application_phase" ADD CONSTRAINT "application_phase_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "demos_app"."application_phase_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."application_phase_type_limit" ADD CONSTRAINT "application_phase_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "demos_app"."phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
