/*
  Warnings:

  - You are about to drop the `application_phase_type_limit` table. If the table is not empty, all the data it contains will be lost.

*/

SET search_path TO demos_app;

-- DropForeignKey
ALTER TABLE "application_phase" DROP CONSTRAINT "application_phase_phase_id_fkey";

-- DropForeignKey
ALTER TABLE "application_phase_type_limit" DROP CONSTRAINT "application_phase_type_limit_id_fkey";

-- DropTable
DROP TABLE "application_phase_type_limit";
