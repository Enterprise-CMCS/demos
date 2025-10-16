/*
  Warnings:

  - Made the column `first_name` on table `person_history` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_name` on table `person_history` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "demos_app"."event" ADD COLUMN     "bundle_id" UUID;
