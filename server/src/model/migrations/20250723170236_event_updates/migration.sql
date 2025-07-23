/*
  Warnings:

  - You are about to drop the column `active_role_id` on the `event` table. All the data in the column will be lost.
  - You are about to drop the column `active_user_id` on the `event` table. All the data in the column will be lost.
  - You are about to drop the column `event_type_id` on the `event` table. All the data in the column will be lost.
  - You are about to drop the column `log_level_id` on the `event` table. All the data in the column will be lost.
  - You are about to drop the column `role_id` on the `event` table. All the data in the column will be lost.
  - You are about to drop the `log_level` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `event_type` to the `event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `log_level` to the `event` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_active_role_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_active_user_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_log_level_id_fkey";

-- AlterTable
ALTER TABLE "event" DROP COLUMN "active_role_id",
DROP COLUMN "active_user_id",
DROP COLUMN "event_type_id",
DROP COLUMN "log_level_id",
DROP COLUMN "role_id",
ADD COLUMN     "event_type" TEXT NOT NULL,
ADD COLUMN     "log_level" TEXT NOT NULL,
ADD COLUMN     "with_role_id" UUID,
ALTER COLUMN "user_id" DROP NOT NULL;

-- DropTable
DROP TABLE "log_level";

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_with_role_id_fkey" FOREIGN KEY ("with_role_id") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
