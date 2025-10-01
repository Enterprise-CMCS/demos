/*
  Warnings:

  - You are about to drop the column `title` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `document_history` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `document_pending_upload` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `document_pending_upload_history` table. All the data in the column will be lost.
  - Added the required column `name` to the `document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `document_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `document_pending_upload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `document_pending_upload_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "demos_app"."document" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document_history" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document_pending_upload" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."document_pending_upload_history" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;
