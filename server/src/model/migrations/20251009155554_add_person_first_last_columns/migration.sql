/*
  Warnings:

  - Added the required column `first_name` to the `person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `person` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "demos_app"."person"
  ADD COLUMN "first_name" TEXT NOT NULL,
  ADD COLUMN "last_name" TEXT NOT NULL,
  DROP COLUMN "display_name",
  DROP COLUMN "full_name";

/*
-- reverse
ALTER TABLE "demos_app"."person"
  ADD COLUMN "display_name" TEXT NOT NULL,
  ADD COLUMN "full_name" TEXT NOT NULL,
  DROP COLUMN "first_name",
  DROP COLUMN "last_name";
*/
