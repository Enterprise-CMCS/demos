-- AlterTable
ALTER TABLE "amendment" ADD COLUMN     "clearance_level_id" TEXT NOT NULL DEFAULT 'CMS (OSORA)';

-- AlterTable
ALTER TABLE "amendment_history" ADD COLUMN     "clearance_level_id" TEXT;

-- AlterTable
ALTER TABLE "demonstration" ADD COLUMN     "clearance_level_id" TEXT NOT NULL DEFAULT 'CMS (OSORA)';

-- AlterTable
ALTER TABLE "demonstration_history" ADD COLUMN     "clearance_level_id" TEXT;

-- AlterTable
ALTER TABLE "extension" ADD COLUMN     "clearance_level_id" TEXT NOT NULL DEFAULT 'CMS (OSORA)';

-- AlterTable
ALTER TABLE "extension_history" ADD COLUMN     "clearance_level_id" TEXT;

-- CreateTable
CREATE TABLE "clearance_level" (
    "id" TEXT NOT NULL,

    CONSTRAINT "clearance_level_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_clearance_level_id_fkey" FOREIGN KEY ("clearance_level_id") REFERENCES "clearance_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_clearance_level_id_fkey" FOREIGN KEY ("clearance_level_id") REFERENCES "clearance_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_clearance_level_id_fkey" FOREIGN KEY ("clearance_level_id") REFERENCES "clearance_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
