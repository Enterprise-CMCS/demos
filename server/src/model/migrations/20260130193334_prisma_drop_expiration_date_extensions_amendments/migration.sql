/*
  Warnings:

  - You are about to drop the column `expiration_date` on the `amendment` table. All the data in the column will be lost.
  - You are about to drop the column `expiration_date` on the `amendment_history` table. All the data in the column will be lost.
  - You are about to drop the column `expiration_date` on the `extension` table. All the data in the column will be lost.
  - You are about to drop the column `expiration_date` on the `extension_history` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "amendment" DROP COLUMN "expiration_date";

-- AlterTable
ALTER TABLE "amendment_history" DROP COLUMN "expiration_date";

-- AlterTable
ALTER TABLE "extension" DROP COLUMN "expiration_date";

-- AlterTable
ALTER TABLE "extension_history" DROP COLUMN "expiration_date";
