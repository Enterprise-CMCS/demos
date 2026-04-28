/*
  Warnings:

  - You are about to drop the column `note` on the `deliverable_extension` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `deliverable_extension_history` table. All the data in the column will be lost.

*/

SET search_path TO demos_app;

-- AlterTable
ALTER TABLE "deliverable_extension" DROP COLUMN "note";

-- AlterTable
ALTER TABLE "deliverable_extension_history" DROP COLUMN "note";
