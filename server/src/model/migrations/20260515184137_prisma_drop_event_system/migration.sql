/*
  Warnings:

  - You are about to drop the `event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `event_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `log_level` table. If the table is not empty, all the data it contains will be lost.

*/

SET search_path TO demos_app;

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_application_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_event_type_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_log_level_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_role_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_user_id_fkey";

-- DropTable
DROP TABLE "event";

-- DropTable
DROP TABLE "event_type";

-- DropTable
DROP TABLE "log_level";
