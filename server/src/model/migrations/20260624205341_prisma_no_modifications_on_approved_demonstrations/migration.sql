/*
  Warnings:

  - You are about to drop the `deliverable_demonstration_status_limit` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `demonstration_status_id` to the `amendment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `demonstration_status_id` to the `extension` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "amendment" DROP CONSTRAINT "amendment_demonstration_id_fkey";

-- DropForeignKey
ALTER TABLE "deliverable" DROP CONSTRAINT "deliverable_demonstration_status_id_fkey";

-- DropForeignKey
ALTER TABLE "deliverable_demonstration_status_limit" DROP CONSTRAINT "deliverable_demonstration_status_limit_id_fkey";

-- DropForeignKey
ALTER TABLE "extension" DROP CONSTRAINT "extension_demonstration_id_fkey";

-- AlterTable
ALTER TABLE "amendment" ADD COLUMN     "demonstration_status_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "extension" ADD COLUMN     "demonstration_status_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "deliverable_demonstration_status_limit";

-- CreateTable
CREATE TABLE "approved_application_status_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "approved_application_status_limit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_demonstration_id_demonstration_status_id_fkey" FOREIGN KEY ("demonstration_id", "demonstration_status_id") REFERENCES "demonstration"("id", "status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_demonstration_status_id_fkey" FOREIGN KEY ("demonstration_status_id") REFERENCES "approved_application_status_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approved_application_status_limit" ADD CONSTRAINT "approved_application_status_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable" ADD CONSTRAINT "deliverable_demonstration_status_id_fkey" FOREIGN KEY ("demonstration_status_id") REFERENCES "approved_application_status_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_demonstration_id_demonstration_status_id_fkey" FOREIGN KEY ("demonstration_id", "demonstration_status_id") REFERENCES "demonstration"("id", "status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_demonstration_status_id_fkey" FOREIGN KEY ("demonstration_status_id") REFERENCES "approved_application_status_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
