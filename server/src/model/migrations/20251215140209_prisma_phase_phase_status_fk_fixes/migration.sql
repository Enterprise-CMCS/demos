
-- DropForeignKey
ALTER TABLE "application_phase" DROP CONSTRAINT "application_phase_phase_status_id_fkey";

-- AddForeignKey
ALTER TABLE "phase_phase_status" ADD CONSTRAINT "phase_phase_status_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_phase_status" ADD CONSTRAINT "phase_phase_status_phase_status_id_fkey" FOREIGN KEY ("phase_status_id") REFERENCES "phase_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
