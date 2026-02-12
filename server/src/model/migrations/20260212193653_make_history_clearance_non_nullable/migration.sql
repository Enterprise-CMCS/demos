/*
  Warnings:

  - Made the column `clearance_level_id` on table `amendment_history` required. This step will fail if there are existing NULL values in that column.
  - Made the column `clearance_level_id` on table `demonstration_history` required. This step will fail if there are existing NULL values in that column.
  - Made the column `clearance_level_id` on table `extension_history` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "amendment_history" ALTER COLUMN "clearance_level_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "demonstration_history" ALTER COLUMN "clearance_level_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "extension_history" ALTER COLUMN "clearance_level_id" SET NOT NULL;