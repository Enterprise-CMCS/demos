-- AlterTable
ALTER TABLE "amendment" ADD COLUMN     "sdg_division_id" TEXT,
ADD COLUMN     "signature_level_id" TEXT;

-- AlterTable
ALTER TABLE "amendment_history" ADD COLUMN     "sdg_division_id" TEXT,
ADD COLUMN     "signature_level_id" TEXT;

-- AlterTable
ALTER TABLE "extension" ADD COLUMN     "sdg_division_id" TEXT,
ADD COLUMN     "signature_level_id" TEXT;

-- AlterTable
ALTER TABLE "extension_history" ADD COLUMN     "sdg_division_id" TEXT,
ADD COLUMN     "signature_level_id" TEXT;

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_sdg_division_id_fkey" FOREIGN KEY ("sdg_division_id") REFERENCES "sdg_division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_signature_level_id_fkey" FOREIGN KEY ("signature_level_id") REFERENCES "signature_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_sdg_division_id_fkey" FOREIGN KEY ("sdg_division_id") REFERENCES "sdg_division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_signature_level_id_fkey" FOREIGN KEY ("signature_level_id") REFERENCES "signature_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
